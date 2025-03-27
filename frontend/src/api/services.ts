import { apiClient } from './client';

// Integration services
export const getIntegrations = () => apiClient.get('/integrations');
export const getIntegration = (id: string) => apiClient.get(`/integrations/${id}`);
export const createIntegration = (data: any) => apiClient.post('/integrations', data);
export const updateIntegration = (id: string, data: any) => apiClient.put(`/integrations/${id}`, data);
export const deleteIntegration = (id: string) => apiClient.delete(`/integrations/${id}`);
export const triggerSync = (integrationId: string) => apiClient.post(`/sync/integration/${integrationId}`);
export const getSyncLogs = (integrationId: string) => apiClient.get(`/sync/logs/integration/${integrationId}`);

// Connector services
export const getConnectorTypes = () => apiClient.get('/connectors/types');
export const getAuthMethods = (connectorId: string) => apiClient.get(`/connectors/${connectorId}/auth-methods`);
export const getEntities = (connectorId: string) => apiClient.get(`/connectors/${connectorId}/entities`);
export const getEntityFields = (connectorId: string, entityId: string) => 
  apiClient.get(`/connectors/${connectorId}/entities/${entityId}/fields`);
export const authenticateConnector = (connectorId: string, credentials: any) => 
  apiClient.post(`/connectors/${connectorId}/authenticate`, credentials);

// Mapping services
export const getMappings = (integrationId: string) => apiClient.get(`/mappings/integration/${integrationId}`);
export const getMapping = (id: string) => apiClient.get(`/mappings/${id}`);
export const createMapping = (data: any) => apiClient.post('/mappings', data);
export const updateMapping = (id: string, data: any) => apiClient.put(`/mappings/${id}`, data);
export const deleteMapping = (id: string) => apiClient.delete(`/mappings/${id}`);
export const getFieldMappings = (mappingId: string) => apiClient.get(`/mappings/${mappingId}/fields`);
export const createFieldMapping = (mappingId: string, data: any) => apiClient.post(`/mappings/${mappingId}/fields`, data);
export const updateFieldMapping = (id: string, data: any) => apiClient.put(`/mappings/fields/${id}`, data);
export const deleteFieldMapping = (id: string) => apiClient.delete(`/mappings/fields/${id}`);
