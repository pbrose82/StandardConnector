import axios, { AxiosInstance } from 'axios';
import { 
  Connector,
  AuthMethod,
  AuthToken,
  Entity,
  Field,
  ReadOptions,
  QueryOptions,
  QueryResult,
  CreateResult,
  ReadResult,
  UpdateResult,
  DeleteResult
} from '../../core/connector.interface';
import { config } from '../../config';
import { logger } from '../../utils/logger';

export class SAPS4HANAConnector implements Connector {
  id = 'sap-s4hana';
  name = 'SAP S/4HANA';
  version = '1.0.0';
  description = 'Connect with SAP S/4HANA ERP system';
  
  private baseUrl: string;
  private client: AxiosInstance | null = null;
  
  constructor(instanceUrl?: string) {
    this.baseUrl = instanceUrl || 'https://example-s4hana-gateway.com';
  }

  getSupportedAuthMethods(): AuthMethod[] {
    return [
      { 
        type: 'oauth2',
        config: {
          authorizationUrl: `${this.baseUrl}/oauth2/authorize`,
          tokenUrl: `${this.baseUrl}/oauth2/token`,
          scope: 'read write'
        }
      },
      {
        type: 'basic',
        config: {}
      }
    ];
  }
  
  async authenticate(credentials: any): Promise<AuthToken> {
    try {
      logger.info('Authenticating with SAP S/4HANA');
      
      if (credentials.username && credentials.password) {
        // Basic authentication
        this.initializeClientWithBasicAuth(credentials.username, credentials.password);
        
        return {
          accessToken: Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64'),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        };
      } else {
        // OAuth2 authentication
        const response = await axios.post(
          `${this.baseUrl}/oauth2/token`,
          new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: credentials.clientId,
            client_secret: credentials.clientSecret,
            redirect_uri: credentials.redirectUri,
            code: credentials.code
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );
        
        this.initializeClientWithToken(response.data.access_token);
        
        return {
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token,
          expiresAt: new Date(Date.now() + response.data.expires_in * 1000)
        };
      }
    } catch (error) {
      logger.error('SAP S/4HANA authentication error:', error);
      throw new Error('Failed to authenticate with SAP S/4HANA');
    }
  }
  
  async refreshToken(token: AuthToken): Promise<AuthToken> {
    try {
      if (!token.refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await axios.post(
        `${this.baseUrl}/oauth2/token`,
        new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: process.env.SAP_CLIENT_ID!,
          client_secret: process.env.SAP_CLIENT_SECRET!,
          refresh_token: token.refreshToken
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      this.initializeClientWithToken(response.data.access_token);
      
      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || token.refreshToken,
        expiresAt: new Date(Date.now() + response.data.expires_in * 1000)
      };
    } catch (error) {
      logger.error('SAP S/4HANA token refresh error:', error);
      throw new Error('Failed to refresh SAP S/4HANA token');
    }
  }
  
  async getEntities(): Promise<Entity[]> {
    // This is a simplified version. In a real implementation, 
    // you'd fetch entities from the OData service metadata.
    return [
      { id: 'SalesOrder', name: 'SalesOrder', displayName: 'Sales Order' },
      { id: 'Customer', name: 'Customer', displayName: 'Customer' },
      { id: 'Material', name: 'Material', displayName: 'Material' },
      { id: 'Supplier', name: 'Supplier', displayName: 'Supplier' },
      { id: 'PurchaseOrder', name: 'PurchaseOrder', displayName: 'Purchase Order' }
    ];
  }
  
  async getEntityFields(entityId: string): Promise<Field[]> {
    // This is a simplified implementation. In a real connector,
    // you would get this information from the OData $metadata.
    
    // Sample fields for SalesOrder
    if (entityId === 'SalesOrder') {
      return [
        {
          id: 'SalesOrderID',
          entityId,
          name: 'SalesOrderID',
          displayName: 'Sales Order ID',
          dataType: 'string',
          isRequired: true
        },
        {
          id: 'CustomerID',
          entityId,
          name: 'CustomerID',
          displayName: 'Customer ID',
          dataType: 'string',
          isRequired: true
        },
        {
          id: 'CreationDate',
          entityId,
          name: 'CreationDate',
          displayName: 'Creation Date',
          dataType: 'date',
          isRequired: true
        },
        {
          id: 'TotalNetAmount',
          entityId,
          name: 'TotalNetAmount',
          displayName: 'Total Net Amount',
          dataType: 'number',
          isRequired: false
        },
        {
          id: 'OverallStatus',
          entityId,
          name: 'OverallStatus',
          displayName: 'Overall Status',
          dataType: 'enum',
          isRequired: true,
          enumValues: ['Open', 'In Process', 'Delivered', 'Completed', 'Canceled']
        }
      ];
    }
    
    // Default empty fields for other entities
    return [];
  }
  
  async create(entityId: string, data: any): Promise<CreateResult> {
    try {
      this.ensureClient();
      
      // SAP OData services typically use a format like this
      const response = await this.client!.post(
        `/sap/opu/odata/sap/API_${entityId}_SRV/${entityId}Set`,
        data
      );
      
      // Extract ID from response - SAP typically returns the entity
      const id = response.data.d.SalesOrderID || '';
      
      return {
        success: true,
        id,
        data: response.data.d
      };
    } catch (error) {
      logger.error(`Error creating SAP ${entityId}:`, error);
      return {
        success: false,
        id: '',
        data: null,
        error: error.message
      };
    }
  }
  
  async read(entityId: string, id: string, options?: ReadOptions): Promise<ReadResult> {
    try {
      this.ensureClient();
      
      const expand = options?.includeRelated ? '?$expand=to_Items' : '';
      
      const response = await this.client!.get(
        `/sap/opu/odata/sap/API_${entityId}_SRV/${entityId}Set('${id}')${expand}`
      );
      
      return {
        success: true,
        data: response.data.d
      };
    } catch (error) {
      logger.error(`Error reading SAP ${entityId}:`, error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }
  
  async query(entityId: string, query: any, options?: QueryOptions): Promise<QueryResult> {
    try {
      this.ensureClient();
      
      // Build OData query string
      let filter = '';
      const filterConditions = [];
      
      for (const [key, value] of Object.entries(query)) {
        // Handle string values with quotes
        const formattedValue = typeof value === 'string' 
          ? `'${value}'` 
          : value;
        
        filterConditions.push(`${key} eq ${formattedValue}`);
      }
      
      if (filterConditions.length > 0) {
        filter = `$filter=${filterConditions.join(' and ')}`;
      }
      
      // Add options
      const select = options?.fields ? `$select=${options.fields.join(',')}` : '';
      const orderBy = options?.orderBy ? `$orderby=${options.orderBy} ${options.orderDirection === 'desc' ? 'desc' : 'asc'}` : '';
      const top = options?.limit ? `$top=${options.limit}` : '';
      const skip = options?.offset ? `$skip=${options.offset}` : '';
      const expand = options?.includeRelated ? '$expand=to_Items' : '';
      
      // Combine query parameters
      const queryParams = [filter, select, orderBy, top, skip, expand]
        .filter(param => param)
        .join('&');
      
      const url = `/sap/opu/odata/sap/API_${entityId}_SRV/${entityId}Set${queryParams ? '?' + queryParams : ''}`;
      
      const response = await this.client!.get(url);
      
      return {
        records: response.data.d.results,
        totalCount: response.data.d.__count || response.data.d.results.length,
        hasMore: Boolean(response.data.d.__next)
      };
    } catch (error) {
      logger.error(`Error querying SAP ${entityId}:`, error);
      throw new Error(`Failed to query ${entityId}`);
    }
  }
  
  async update(entityId: string, id: string, data: any): Promise<UpdateResult> {
    try {
      this.ensureClient();
      
      // SAP OData services typically use a format like this
      // Note: SAP often uses MERGE for partial updates
      await this.client!.patch(
        `/sap/opu/odata/sap/API_${entityId}_SRV/${entityId}Set('${id}')`,
        data
      );
      
      return {
        success: true,
        id,
        data
      };
    } catch (error) {
      logger.error(`Error updating SAP ${entityId}:`, error);
      return {
        success: false,
        id,
        data: null,
        error: error.message
      };
    }
  }
  
  async delete(entityId: string, id: string): Promise<DeleteResult> {
    try {
      this.ensureClient();
      
      await this.client!.delete(
        `/sap/opu/odata/sap/API_${entityId}_SRV/${entityId}Set('${id}')`
      );
      
      return {
        success: true,
        id
      };
    } catch (error) {
      logger.error(`Error deleting SAP ${entityId}:`, error);
      return {
        success: false,
        id,
        error: error.message
      };
    }
  }
  
  private initializeClientWithToken(accessToken: string): void {
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: config.connectorTimeoutMs
    });
    
    this.setupInterceptors();
  }
  
  private initializeClientWithBasicAuth(username: string, password: string): void {
    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: config.connectorTimeoutMs
    });
    
    this.setupInterceptors();
  }
  
  private setupInterceptors(): void {
    // Add response interceptor for error handling
    this.client!.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          // Token expired, should trigger a refresh
          logger.warn('SAP token expired');
        }
        return Promise.reject(error);
      }
    );
  }
  
  private ensureClient(): void {
    if (!this.client) {
      throw new Error('SAP client not initialized. Call authenticate() first.');
    }
  }
}
