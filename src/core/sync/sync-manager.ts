// src/core/sync/sync-manager.ts
import { Integration } from '../../models/integration.model';
import { Mapping } from '../../models/mapping.model';
import { FieldMapping } from '../../models/field-mapping.model';
import { SyncLog } from '../../models/sync-log.model';
import { MappingEngine } from '../mapping/mapping-engine';
import { connectorRegistry } from '../connector-registry.service';
import { transformationService } from '../transformation/transformation.service';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { FieldMappingDTO, MappingType } from '../mapping/mapping-types';

export class SyncManager {
  private mappingEngine: MappingEngine;
  
  constructor() {
    this.mappingEngine = new MappingEngine(transformationService);
  }

  /**
   * Synchronize data for a specific integration
   */
  async syncIntegration(integrationId: string): Promise<any> {
    const syncLog = new SyncLog({
      integrationId,
      startTime: new Date(),
      status: 'running'
    });
    
    try {
      logger.info(`Starting sync for integration ${integrationId}`);
      
      // 1. Get integration details
      const integration = await Integration.findById(integrationId);
      if (!integration) {
        throw new Error(`Integration not found: ${integrationId}`);
      }

      syncLog.integrationType = `${integration.sourceConnectorId} → ${integration.targetConnectorId}`;
      await syncLog.save();

      // 2. Get connectors
      const sourceConnector = connectorRegistry.getConnector(integration.sourceConnectorId);
      const targetConnector = connectorRegistry.getConnector(integration.targetConnectorId);
      
      if (!sourceConnector || !targetConnector) {
        throw new Error('Connector not found');
      }

      // 3. Get mappings
      const mappings = await Mapping.find({ integrationId });
      
      // 4. Process each mapping
      const results = [];
      
      for (const mapping of mappings) {
        logger.info(`Processing mapping ${mapping._id} (${mapping.name})`);
        
        // 4.1 Get field mappings
        const fieldMappings = await FieldMapping.find({ mappingId: mapping._id });
        
        // Convert Mongoose documents to FieldMappingDTO objects
        const fieldMappingsDTO: FieldMappingDTO[] = fieldMappings.map(mapping => ({
          id: mapping._id.toString(),
          mappingId: mapping.mappingId.toString(),
          sourceFieldId: mapping.sourceFieldId,
          targetFieldId: mapping.targetFieldId,
          sourceFieldPath: mapping.sourceFieldPath,
          targetFieldPath: mapping.targetFieldPath,
          mappingType: mapping.mappingType,
          mappingConfig: mapping.mappingConfig,
          transformations: mapping.transformations
        }));
        
        // 4.2 Get source data
        const sourceQuery = mapping.filterCondition ? JSON.parse(mapping.filterCondition) : {};
        const sourceData = await sourceConnector.query(
          mapping.sourceEntityId,
          sourceQuery
        );
        
        logger.info(`Retrieved ${sourceData.records.length} records from source`);
        
        // 4.3 Get field definitions
        const sourceFields = await sourceConnector.getEntityFields(mapping.sourceEntityId);
        const targetFields = await targetConnector.getEntityFields(mapping.targetEntityId);
        
        // 4.4 Transform and sync each record
        let successCount = 0;
        let errorCount = 0;
        
        for (const record of sourceData.records) {
          try {
            // Transform data using the DTO objects instead of Mongoose documents
            const transformedData = await this.mappingEngine.transformData(
              record,
              fieldMappingsDTO,
              sourceFields,
              targetFields
            );
            
            // Create or update in target system
            let result;
            
            if (integration.syncDirection === 'source_to_target') {
              // Check if the record already exists in the target system
              // This is a simplified approach - in real life you'd need a more robust way to match records
              const targetQuery = { [mapping.targetKeyField]: transformedData[mapping.targetKeyField] };
              const existingRecords = await targetConnector.query(mapping.targetEntityId, targetQuery);
              
              if (existingRecords.records.length > 0) {
                // Update existing record
                const existingId = existingRecords.records[0].id;
                result = await targetConnector.update(mapping.targetEntityId, existingId, transformedData);
              } else {
                // Create new record
                result = await targetConnector.create(mapping.targetEntityId, transformedData);
              }
            }
            
            results.push(result);
            successCount++;
          } catch (error) {
            logger.error(`Error processing record:`, error);
            errorCount++;
          }
        }
        
        logger.info(`Processed mapping: ${successCount} successes, ${errorCount} errors`);
        
        // Update mapping stats
        mapping.lastSyncAt = new Date();
        mapping.recordsProcessed = sourceData.records.length;
        mapping.recordsSucceeded = successCount;
        mapping.recordsFailed = errorCount;
        await mapping.save();
      }
      
      // 5. Update integration status
      integration.lastSyncAt = new Date();
      integration.status = 'active';
      await integration.save();
      
      // Update sync log
      syncLog.endTime = new Date();
      syncLog.status = 'completed';
      syncLog.recordsProcessed = results.length;
      syncLog.recordsSucceeded = results.filter(r => r && r.success).length;
      syncLog.recordsFailed = syncLog.recordsProcessed - syncLog.recordsSucceeded;
      await syncLog.save();
      
      logger.info(`Sync completed for integration ${integrationId}`);
      
      return {
        success: true,
        integration: integration._id,
        timestamp: new Date(),
        results
      };
    } catch (error) {
      logger.error(`Sync error for integration ${integrationId}:`, error);
      
      // Update integration status to error
      await Integration.findByIdAndUpdate(integrationId, {
        status: 'error'
      });
      
      // Update sync log
      syncLog.endTime = new Date();
      syncLog.status = 'failed';
      syncLog.error = error instanceof Error ? error.message : String(error);
      await syncLog.save();
      
      throw error;
    }
  }
}

// Export a singleton instance
export const syncManager = new SyncManager();
