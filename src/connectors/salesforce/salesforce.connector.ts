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
  DeleteResult,
  WebhookEvent
} from '../../core/connector.interface';
import { config } from '../../config';
import { logger } from '../../utils/logger';

export class SalesforceConnector implements Connector {
  id = 'salesforce';
  name = 'Salesforce';
  version = '1.0.0';
  description = 'Connect with Salesforce CRM';
  
  private baseUrl: string;
  private apiVersion = 'v55.0';
  private client: AxiosInstance | null = null;
  
  constructor(instanceUrl?: string) {
    this.baseUrl = instanceUrl || 'https://login.salesforce.com';
  }

  getSupportedAuthMethods(): AuthMethod[] {
    return [{ 
      type: 'oauth2',
      config: {
        authorizationUrl: `${this.baseUrl}/services/oauth2/authorize`,
        tokenUrl: `${this.baseUrl}/services/oauth2/token`,
        scope: 'api refresh_token'
      }
    }];
  }
  
  async authenticate(credentials: any): Promise<AuthToken> {
    try {
      logger.info('Authenticating with Salesforce');
      
      const response = await axios.post(
        `${this.baseUrl}/services/oauth2/token`,
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
      
      // Initialize client with the new token
      this.initializeClient(response.data.access_token, response.data.instance_url);
      
      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
        additionalData: {
          instanceUrl: response.data.instance_url
        }
      };
    } catch (error) {
      logger.error('Salesforce authentication error:', error);
      throw new Error('Failed to authenticate with Salesforce');
    }
  }
  
  async refreshToken(token: AuthToken): Promise<AuthToken> {
    try {
      if (!token.refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await axios.post(
        `${this.baseUrl}/services/oauth2/token`,
        new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: process.env.SALESFORCE_CLIENT_ID!,
          client_secret: process.env.SALESFORCE_CLIENT_SECRET!,
          refresh_token: token.refreshToken
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      // Initialize client with the new token
      const instanceUrl = token.additionalData?.instanceUrl || this.baseUrl;
      this.initializeClient(response.data.access_token, instanceUrl);
      
      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || token.refreshToken,
        expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
        additionalData: {
          instanceUrl
        }
      };
    } catch (error) {
      logger.error('Salesforce token refresh error:', error);
      throw new Error('Failed to refresh Salesforce token');
    }
  }
  
  async getEntities(): Promise<Entity[]> {
    try {
      this.ensureClient();
      
      const response = await this.client!.get(
        `/services/data/${this.apiVersion}/sobjects`
      );
      
      return response.data.sobjects
        .filter((obj: any) => obj.queryable && !obj.deprecatedAndHidden)
        .map((obj: any) => ({
          id: obj.name,
          name: obj.name,
          displayName: obj.label,
          description: obj.labelPlural
        }));
    } catch (error) {
      logger.error('Error fetching Salesforce entities:', error);
      throw new Error('Failed to fetch Salesforce objects');
    }
  }
  
  async getEntityFields(entityId: string): Promise<Field[]> {
    try {
      this.ensureClient();
      
      const response = await this.client!.get(
        `/services/data/${this.apiVersion}/sobjects/${entityId}/describe`
      );
      
      return response.data.fields.map((field: any) => ({
        id: field.name,
        entityId,
        name: field.name,
        displayName: field.label,
        description: field.inlineHelpText,
        dataType: this.mapSalesforceType(field.type),
        isRequired: field.nillable === false,
        isReadOnly: field.updateable === false,
        defaultValue: field.defaultValue,
        enumValues: field.picklistValues?.map((v: any) => v.value) || undefined,
        maxLength: field.length || undefined
      }));
    } catch (error) {
      logger.error(`Error fetching Salesforce fields for ${entityId}:`, error);
      throw new Error(`Failed to fetch fields for ${entityId}`);
    }
  }
  
  async create(entityId: string, data: any): Promise<CreateResult> {
    try {
      this.ensureClient();
      
      const response = await this.client!.post(
        `/services/data/${this.apiVersion}/sobjects/${entityId}`,
        data
      );
      
      return {
        success: true,
        id: response.data.id,
        data: response.data
      };
    } catch (error) {
      logger.error(`Error creating Salesforce ${entityId}:`, error);
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
      
      const fieldsParam = options?.fields ? `?fields=${options.fields.join(',')}` : '';
      
      const response = await this.client!.get(
        `/services/data/${this.apiVersion}/sobjects/${entityId}/${id}${fieldsParam}`
      );
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error(`Error reading Salesforce ${entityId}:`, error);
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
      
      // Build SOQL query
      const fields = options?.fields?.join(', ') || 'Id, Name';
      let soql = `SELECT ${fields} FROM ${entityId}`;
      
      // Add WHERE clauses
      const conditions = [];
      for (const [key, value] of Object.entries(query)) {
        conditions.push(`${key} = '${value}'`);
      }
      
      if (conditions.length > 0) {
        soql += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      // Add ORDER BY
      if (options?.orderBy) {
        soql += ` ORDER BY ${options.orderBy} ${options.orderDirection || 'ASC'}`;
      }
      
      // Add LIMIT and OFFSET
      if (options?.limit) {
        soql += ` LIMIT ${options.limit}`;
      }
      
      if (options?.offset) {
        soql += ` OFFSET ${options.offset}`;
      }
      
      const response = await this.client!.get(
        `/services/data/${this.apiVersion}/query/?q=${encodeURIComponent(soql)}`
      );
      
      return {
        records: response.data.records,
        totalCount: response.data.totalSize,
        hasMore: !response.data.done
      };
    } catch (error) {
      logger.error(`Error querying Salesforce ${entityId}:`, error);
      throw new Error(`Failed to query ${entityId}`);
    }
  }
  
  async update(entityId: string, id: string, data: any): Promise<UpdateResult> {
    try {
      this.ensureClient();
      
      // Salesforce doesn't return data on PATCH, just a 204 No Content
      await this.client!.patch(
        `/services/data/${this.apiVersion}/sobjects/${entityId}/${id}`,
        data
      );
      
      return {
        success: true,
        id,
        data
      };
    } catch (error) {
      logger.error(`Error updating Salesforce ${entityId}:`, error);
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
      
      // Salesforce doesn't return data on DELETE, just a 204 No Content
      await this.client!.delete(
        `/services/data/${this.apiVersion}/sobjects/${entityId}/${id}`
      );
      
      return {
        success: true,
        id
      };
    } catch (error) {
      logger.error(`Error deleting Salesforce ${entityId}:`, error);
      return {
        success: false,
        id,
        error: error.message
      };
    }
  }
  
  async getSupportedEvents(): Promise<WebhookEvent[]> {
    return [
      {
        id: 'record.created',
        name: 'Record Created',
        description: 'Triggered when a record is created'
      },
      {
        id: 'record.updated',
        name: 'Record Updated',
        description: 'Triggered when a record is updated'
      },
      {
        id: 'record.deleted',
        name: 'Record Deleted',
        description: 'Triggered when a record is deleted'
      }
    ];
  }
  
  private initializeClient(accessToken: string, instanceUrl: string): void {
    this.client = axios.create({
      baseURL: instanceUrl,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: config.connectorTimeoutMs
    });
    
    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          // Token expired, should trigger a refresh
          logger.warn('Salesforce token expired');
        }
        return Promise.reject(error);
      }
    );
  }
  
  private ensureClient(): void {
    if (!this.client) {
      throw new Error('Salesforce client not initialized. Call authenticate() first.');
    }
  }
  
  private mapSalesforceType(sfType: string): string {
    const typeMap: Record<string, string> = {
      'id': 'string',
      'string': 'string',
      'picklist': 'enum',
      'multipicklist': 'array',
      'boolean': 'boolean',
      'int': 'integer',
      'double': 'number',
      'currency': 'number',
      'percent': 'number',
      'date': 'date',
      'datetime': 'datetime',
      'reference': 'reference',
      'email': 'email',
      'phone': 'phone',
      'url': 'url',
      'textarea': 'text',
      'address': 'address'
    };
    
    return typeMap[sfType] || 'string';
  }
}
