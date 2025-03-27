export interface AuthMethod {
  type: 'oauth2' | 'api_key' | 'basic' | 'custom';
  config: any;
}

export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  additionalData?: any;
}

export interface Entity {
  id: string;
  name: string;
  displayName: string;
  description?: string;
}

export interface Field {
  id: string;
  entityId: string;
  name: string;
  displayName: string;
  description?: string;
  dataType: string;
  isRequired: boolean;
  isReadOnly?: boolean;
  defaultValue?: any;
  enumValues?: string[];
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  regex?: string;
}

export interface ReadOptions {
  fields?: string[];
  includeRelated?: boolean;
}

export interface QueryOptions {
  fields?: string[];
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  includeRelated?: boolean;
}

export interface QueryResult {
  records: any[];
  totalCount: number;
  hasMore: boolean;
}

export interface CreateResult {
  success: boolean;
  id: string;
  data: any;
  error?: string;
}

export interface ReadResult {
  success: boolean;
  data: any;
  error?: string;
}

export interface UpdateResult {
  success: boolean;
  id: string;
  data: any;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  id: string;
  error?: string;
}

export interface WebhookRegistration {
  id: string;
  url: string;
  events: string[];
  secret?: string;
}

export interface WebhookEvent {
  id: string;
  name: string;
  description: string;
}

export interface PollingStrategy {
  interval: number; // milliseconds
  queryField: string;
  queryType: 'timestamp' | 'id' | 'custom';
}

export interface Operation {
  id: string;
  name: string;
  description: string;
  parameters: any[];
}

export interface OperationResult {
  success: boolean;
  data: any;
  error?: string;
}

export interface Connector {
  id: string;
  name: string;
  version: string;
  description: string;
  
  // Authentication
  getSupportedAuthMethods(): AuthMethod[];
  authenticate(credentials: any): Promise<AuthToken>;
  refreshToken(token: AuthToken): Promise<AuthToken>;
  
  // Schema
  getEntities(): Promise<Entity[]>;
  getEntityFields(entityId: string): Promise<Field[]>;
  
  // CRUD Operations
  create(entityId: string, data: any): Promise<CreateResult>;
  read(entityId: string, id: string, options?: ReadOptions): Promise<ReadResult>;
  query(entityId: string, query: any, options?: QueryOptions): Promise<QueryResult>;
  update(entityId: string, id: string, data: any): Promise<UpdateResult>;
  delete(entityId: string, id: string): Promise<DeleteResult>;
  
  // Events
  getSupportedEvents?(): Promise<WebhookEvent[]>;
  registerWebhook?(event: string, callbackUrl: string): Promise<WebhookRegistration>;
  unregisterWebhook?(webhookId: string): Promise<boolean>;
  getPollingStrategy?(entityId: string): PollingStrategy;
  
  // Custom Operations
  getSupportedOperations?(): Promise<Operation[]>;
  executeOperation?(operationId: string, params: any): Promise<OperationResult>;
}
