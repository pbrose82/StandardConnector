import { FieldMappingDTO, MappingType } from './mapping-types';
import { TransformationService } from '../transformation/transformation.service';
import { logger } from '../../utils/logger';

export class MappingEngine {
  constructor(private transformationService: TransformationService) {}

  /**
   * Transform data from source to target format based on field mappings
   */
  async transformData(
    sourceData: any,
    fieldMappings: FieldMappingDTO[],
    sourceFields: any[],
    targetFields: any[]
  ): Promise<any> {
    logger.debug('Starting data transformation', { 
      mappingsCount: fieldMappings.length 
    });
    
    const result: any = {};

    for (const mapping of fieldMappings) {
      try {
        const sourceField = sourceFields.find(f => f.id === mapping.sourceFieldId);
        const targetField = targetFields.find(f => f.id === mapping.targetFieldId);
        
        if (!sourceField || !targetField) {
          logger.warn(`Missing field definition for mapping ${mapping.id}`, {
            sourceFieldId: mapping.sourceFieldId,
            targetFieldId: mapping.targetFieldId
          });
          continue;
        }

        let value;
        
        // Extract source value using field path (supports nested objects)
        const sourceValue = this.getNestedValue(sourceData, mapping.sourceFieldPath);
        
        // Apply mapping based on type
        switch (mapping.mappingType) {
          case MappingType.DIRECT:
            value = sourceValue;
            break;
            
          case MappingType.COMPOSITE:
            if (mapping.mappingConfig?.sourceFields) {
              const values = mapping.mappingConfig.sourceFields.map(field => 
                this.getNestedValue(sourceData, field));
              value = values.join(mapping.mappingConfig.separator || ' ');
            } else {
              value = sourceValue;
            }
            break;
            
          case MappingType.CONDITIONAL:
            if (mapping.mappingConfig?.conditions) {
              for (const condition of mapping.mappingConfig.conditions) {
                // Simple condition evaluation 
                // For more complex conditions, this could be replaced with a rule engine
                if (this.evaluateCondition(condition.when, sourceData)) {
                  value = condition.then;
                  break;
                }
              }
              // Use else value if provided and no conditions matched
              if (value === undefined && mapping.mappingConfig.conditions[0].else) {
                value = mapping.mappingConfig.conditions[0].else;
              }
            } else {
              value = sourceValue;
            }
            break;
            
          case MappingType.LOOKUP:
            // Lookup mappings would typically query another entity
            // This is a simplified placeholder
            value = sourceValue;
            logger.debug('Lookup mapping not fully implemented');
            break;
            
          case MappingType.DEFAULT_VALUE:
            value = sourceValue !== undefined ? sourceValue : mapping.mappingConfig?.defaultValue;
            break;
            
          case MappingType.CUSTOM_FUNCTION:
            if (mapping.mappingConfig?.function) {
              value = await this.transformationService.executeFunction(
                mapping.mappingConfig.function,
                sourceValue,
                mapping.mappingConfig.params
              );
            } else {
              value = sourceValue;
            }
            break;
            
          default:
            logger.warn(`Unsupported mapping type: ${mapping.mappingType}`);
            value = sourceValue;
        }
        
        // Apply transformations if defined
        if (mapping.transformations && mapping.transformations.length > 0) {
          for (const transformation of mapping.transformations) {
            value = await this.transformationService.applyTransformation(
              value,
              transformation.type,
              transformation.config
            );
          }
        }
        
        // Set the value in the result object using the target field path
        this.setNestedValue(result, mapping.targetFieldPath, value);
      } catch (error) {
        logger.error(`Error processing mapping ${mapping.id}:`, error);
        // Continue with next mapping rather than failing the entire transformation
      }
    }
    
    logger.debug('Data transformation completed successfully');
    return result;
  }

  /**
   * Get a value from a nested object using a path string (e.g., "user.address.city")
   */
  private getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
      // Handle array indexing (e.g., items[0])
      const arrayMatch = key.match(/^(.*)\[(\d+)\]$/);
      
      if (arrayMatch) {
        const [, arrayName, indexStr] = arrayMatch;
        const index = parseInt(indexStr, 10);
        
        if (!value[arrayName] || !Array.isArray(value[arrayName])) {
          return undefined;
        }
        
        value = value[arrayName][index];
      } else {
        value = value[key];
      }
      
      if (value === undefined) return undefined;
    }
    
    return value;
  }

  /**
   * Set a value in a nested object using a path string
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    if (!obj || !path) return;
    
    const keys = path.split('.');
    const lastKey = keys.pop();
    
    if (!lastKey) return;
    
    let current = obj;
    
    // Navigate to the parent object where we'll set the value
    for (const key of keys) {
      // Handle array indexing
      const arrayMatch = key.match(/^(.*)\[(\d+)\]$/);
      
      if (arrayMatch) {
        const [, arrayName, indexStr] = arrayMatch;
        const index = parseInt(indexStr, 10);
        
        if (!current[arrayName]) {
          current[arrayName] = [];
        }
        
        if (!current[arrayName][index]) {
          current[arrayName][index] = {};
        }
        
        current = current[arrayName][index];
      } else {
        if (!current[key]) {
          current[key] = {};
        }
        current = current[key];
      }
    }
    
    // Set the value on the last key
    const arrayMatch = lastKey.match(/^(.*)\[(\d+)\]$/);
    
    if (arrayMatch) {
      const [, arrayName, indexStr] = arrayMatch;
      const index = parseInt(indexStr, 10);
      
      if (!current[arrayName]) {
        current[arrayName] = [];
      }
      
      current[arrayName][index] = value;
    } else {
      current[lastKey] = value;
    }
  }

  /**
   * Evaluate a simple condition string
   * This is a basic implementation - could be replaced with a rule engine
   */
  private evaluateCondition(condition: string, data: any): boolean {
    try {
      // Simple equality check (e.g., "status=Active")
      const equalityMatch = condition.match(/^(\w+)=(.+)$/);
      if (equalityMatch) {
        const [, field, expectedValue] = equalityMatch;
        const actualValue = this.getNestedValue(data, field);
        return String(actualValue) === expectedValue;
      }
      
      // Contains check (e.g., "tags:Premium")
      const containsMatch = condition.match(/^(\w+):(.+)$/);
      if (containsMatch) {
        const [, field, searchValue] = containsMatch;
        const actualValue = this.getNestedValue(data, field);
        
        if (Array.isArray(actualValue)) {
          return actualValue.includes(searchValue);
        } else if (typeof actualValue === 'string') {
          return actualValue.includes(searchValue);
        }
        return false;
      }
      
      // Greater than check (e.g., "amount>100")
      const greaterMatch = condition.match(/^(\w+)>(.+)$/);
      if (greaterMatch) {
        const [, field, compareValue] = greaterMatch;
        const actualValue = this.getNestedValue(data, field);
        return Number(actualValue) > Number(compareValue);
      }
      
      // Less than check (e.g., "amount<100")
      const lessMatch = condition.match(/^(\w+)<(.+)$/);
      if (lessMatch) {
        const [, field, compareValue] = lessMatch;
        const actualValue = this.getNestedValue(data, field);
        return Number(actualValue) < Number(compareValue);
      }
      
      logger.warn(`Unsupported condition format: ${condition}`);
      return false;
    } catch (error) {
      logger.error(`Error evaluating condition ${condition}:`, error);
      return false;
    }
  }
}
