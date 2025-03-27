export interface Integration {
  _id: string;
  name: string;
  description?: string;
  sourceConnectorId: string;
  targetConnectorId: string;
  status: 'draft' | 'active' | 'paused' | 'error';
  syncDirection: 'source_to_target' | 'target_to_source' | 'bidirectional';
  syncFrequency: 'realtime' | 'minutes_5' | 'minutes_15' | 'hourly' | 'daily' | 'manual';
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Mapping {
  _id: string;
  integrationId: string;
  name: string;
  description?: string;
  sourceEntityId: string;
  targetEntityId: string;
  filterCondition?: string;
  sourceKeyField: string;
  targetKeyField: string;
  lastSyncAt?: string;
  recordsProcessed?: number;
  recordsSucceeded?: number;
  recordsFailed?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FieldMapping {
  _id: string;
  mappingId: string;
  sourceFieldId: string;
  targetFieldId: string;
  sourceFieldPath: string;
  targetFieldPath: string;
  mappingType: string;
  mappingConfig?: any;
  transformations?: any[];
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
}

export interface SyncLog {
  _id: string;
  integrationId: string;
  integrationType?: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'completed' | 'failed';
  recordsProcessed?: number;
  recordsSucceeded?: number;
  recordsFailed?: number;
  error?: string;
}

export interface AuthMethod {
  type: 'oauth2' | 'api_key' | 'basic' | 'custom';
  config: any;
}
