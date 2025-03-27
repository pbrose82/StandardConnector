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

export class HubSpotConnector implements Connector {
  id = 'hubspot';
  name = 'HubSpot';
  version = '1.0.0';
  description = 'Connect with HubSpot CRM';
  
  private baseUrl = 'https://api.hubapi.com';
  private client: AxiosInstance | null = null;
  
  constructor() {}

  getSupportedAuthMethods(): AuthMethod[] {
    return [
      { 
        type: 'oauth2',
        config: {
          authorizationUrl: 'https://app.hubspot.com/oauth/authorize',
          tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
          scope: 'contacts content'
        }
      },
      {
        type: 'api_key',
        config: {
          name: 'hapikey',
          in: 'query'
        }
      }
    ];
  }
  
  async authenticate(credentials: any): Promise<AuthToken> {
    try {
      logger.info('Authenticating with HubSpot');
      
      if (credentials.apiKey) {
        // API Key authentication
        this.initializeClientWithApiKey(credentials.apiKey);
        
        return {
          accessToken: credentials.apiKey,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
        };
      } else {
        // OAuth2 authentication
        const response = await axios.post(
          'https://api.hubapi.com/oauth/v1/token',
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
      logger.error('HubSpot authentication error:', error);
      throw new Error('Failed to authenticate with HubSpot');
    }
  }
  
  async refreshToken(token: AuthToken): Promise<AuthToken> {
    try {
      if (!token.refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await axios.post(
        'https://api.hubapi.com/oauth/v1/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: process.env.HUBSPOT_CLIENT_ID!,
          client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
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
      logger.error('HubSpot token refresh error:', error);
      throw new Error('Failed to refresh HubSpot token');
    }
  }
  
  async getEntities(): Promise<Entity[]> {
    // HubSpot has fixed CRM objects
    return [
      { id: 'contacts', name: 'contacts', displayName: 'Contacts' },
      { id: 'companies', name: 'companies', displayName: 'Companies' },
      { id: 'deals', name: 'deals', displayName: 'Deals' },
      { id: 'tickets', name: 'tickets', displayName: 'Tickets' },
      { id: 'products', name: 'products', displayName: 'Products' }
    ];
  }
  
  async getEntityFields(entityId: string): Promise<Field[]> {
    try {
      this.ensureClient();
      
      // Get standard properties for this object type
      const response = await this.client!.get(
        `/properties/v2/${entityId}/properties`
      );
      
      return response.data.map((prop: any) => ({
        id: prop.name,
        entityId,
        name: prop.name,
        displayName: prop.label,
        description: prop.description,
        dataType: this.mapHubSpotType(prop.type),
        isRequired: prop.required || false,
        isReadOnly: prop.readOnlyValue || false,
        defaultValue: prop.defaultValue,
        enumValues: prop.options?.map((opt: any) => opt.value) || undefined
      }));
    } catch (error) {
      logger.error(`Error fetching HubSpot fields for ${entityId}:`, error);
      throw new Error(`Failed to fetch fields for ${entityId}`);
    }
  }
  
  async create(entityId: string, data: any): Promise<CreateResult> {
    try {
      this.ensureClient();
      
      const response = await this.client!.post(
        `/crm/v3/objects/${entityId}`,
        {
          properties: data
        }
      );
      
      return {
        success: true,
        id: response.data.id,
        data: response.data.properties
      };
    } catch (error) {
      logger.error(`Error creating HubSpot ${entityId}:`, error);
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
      
      const properties = options?.fields ? `properties=${options.fields.join(',')}` : '';
      const queryParams = properties ? `?${properties}` : '';
      
      const response = await this.client!.get(
        `/crm/v3/objects/${entityId}/${id}${queryParams}`
      );
      
      return {
        success: true,
        data: response.data.properties
      };
    } catch (error) {
      logger.error(`Error reading HubSpot ${entityId}:`, error);
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
      
      // Build query parameters
      const limit = options?.limit || 100;
      const after = options?.offset ? options.offset.toString() : undefined;
      const properties = options?.fields?.join(',');
      
      // Build filter groups and filters
      const filters = [];
      for (const [key, value] of Object.entries(query)) {
        filters.push({
          propertyName: key,
          operator: 'EQ',
          value: value as string
        });
      }
      
      const filterGroups = filters.length > 0 ? [{ filters }] : [];
      
      const requestBody = {
        filterGroups,
        sorts: options?.orderBy ? [
          {
            propertyName: options.orderBy,
            direction: options.orderDirection?.toUpperCase() || 'ASCENDING'
          }
        ] : [],
        properties: properties ? properties.split(',') : undefined,
        limit,
        after
      };
      
      const response = await this.client!.post(
        `/crm/v3/objects/${entityId}/search`,
        requestBody
      );
      
      return {
        records: response.data.results.map((result: any) => ({
          id: result.id,
          ...result.properties
        })),
        totalCount: response.data.total,
        hasMore: response.data.paging?.next?.after !== undefined
      };
    } catch (error) {
      logger.error(`Error querying HubSpot ${entityId}:`, error);
      throw new Error(`Failed to query ${entityId}`);
    }
  }
  
  async update(entityId: string, id: string, data: any): Promise<UpdateResult> {
    try {
      this.ensureClient();
      
      const response = await this.client!.patch(
        `/crm/v3/objects/${entityId}/${id}`,
        {
          properties: data
        }
      );
      
      return {
        success: true,
        id,
        data: response.data.properties
      };
    } catch (error) {
      logger.error(`Error updating HubSpot ${entityId}:`, error);
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
        `/crm/v3/objects/${entityId}/${id}`
      );
      
      return {
        success: true,
        id
      };
    } catch (error) {
      logger.error(`Error deleting HubSpot ${entityId}:`, error);
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
        'Content-Type': 'application/json'
      },
      timeout: config.connectorTimeoutMs
    });
    
    this.setupInterceptors();
  }
  
  private initializeClientWithApiKey(apiKey: string): void {
    this.client = axios.create({
      baseURL: this.baseUrl,
      params: {
        hapikey: apiKey
      },
      headers: {
        'Content-Type': 'application/json'
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
          logger.warn('HubSpot token expired');
        }
        return Promise.reject(error);
      }
    );
  }
  
  private ensureClient(): void {
    if (!this.client) {
      throw new Error('HubSpot client not initialized. Call authenticate() first.');
    }
  }
  
  private mapHubSpotType(hubspotType: string): string {
    const typeMap: Record<string, string> = {
      'string': 'string',
      'number': 'number',
      'date': 'date',
      'datetime': 'datetime',
      'enumeration': 'enum',
      'bool': 'boolean'
    };
    
    return typeMap[hubspotType] || 'string';
  }
}
