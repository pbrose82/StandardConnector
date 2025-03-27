import { logger } from '../../utils/logger';

export class TransformationService {
  /**
   * Apply a transformation to a value
   */
  async applyTransformation(
    value: any,
    transformationType: string,
    config: any
  ): Promise<any> {
    try {
      switch (transformationType) {
        case 'string.uppercase':
          return typeof value === 'string' ? value.toUpperCase() : value;
          
        case 'string.lowercase':
          return typeof value === 'string' ? value.toLowerCase() : value;
          
        case 'string.trim':
          return typeof value === 'string' ? value.trim() : value;
          
        case 'string.replace':
          if (typeof value === 'string' && config.search && config.replacement) {
            const regex = new RegExp(config.search, config.flags || 'g');
            return value.replace(regex, config.replacement);
          }
          return value;
          
        case 'number.format':
          if (typeof value === 'number') {
            return value.toFixed(config.decimals || 2);
          }
          return value;
          
        case 'number.multiply':
          if (typeof value === 'number' && typeof config.factor === 'number') {
            return value * config.factor;
          }
          return value;
          
        case 'date.format':
          if (value instanceof Date || typeof value === 'string') {
            const date = new Date(value);
            // Simple date formatting - could use a library like date-fns for more options
            return date.toLocaleDateString(config.locale || 'en-US', config.options || {});
          }
          return value;
          
        case 'value.map':
          if (config.mapping && config.mapping[value] !== undefined) {
            return config.mapping[value];
          } else if (config.defaultValue !== undefined) {
            return config.defaultValue;
          }
          return value;
          
        default:
          logger.warn(`Unknown transformation type: ${transformationType}`);
          return value;
      }
    } catch (error) {
      logger.error(`Error applying transformation ${transformationType}:`, error);
      return value;
    }
  }

  /**
   * Apply a composite transformation (multiple fields to one)
   */
  async applyCompositeTransformation(
    data: any,
    config: any
  ): Promise<any> {
    try {
      if (!config || !config.fields || !Array.isArray(config.fields)) {
        return null;
      }
      
      const values = config.fields.map((field: string) => {
        const parts = field.split('.');
        let value = data;
        
        for (const part of parts) {
          if (value === undefined || value === null) return '';
          value = value[part];
        }
        
        return value === undefined || value === null ? '' : String(value);
      });
      
      return values.join(config.separator || ' ');
    } catch (error) {
      logger.error(`Error applying composite transformation:`, error);
      return null;
    }
  }

  /**
   * Apply a conditional transformation based on conditions
   */
  async applyConditionalTransformation(
    data: any,
    config: any
  ): Promise<any> {
    try {
      if (!config || !config.conditions || !Array.isArray(config.conditions)) {
        return null;
      }
      
      for (const condition of config.conditions) {
        if (!condition.when || !condition.then) continue;
        
        // Simple condition parsing - this could be expanded
        const [field, operator, expected] = condition.when.split(/\s*(=|!=|>|<|>=|<=)\s*/);
        if (!field || !operator || expected === undefined) continue;
        
        const actual = data[field];
        let conditionMet = false;
        
        switch (operator) {
          case '=':
            conditionMet = actual == expected;
            break;
          case '!=':
            conditionMet = actual != expected;
            break;
          case '>':
            conditionMet = actual > expected;
            break;
          case '<':
            conditionMet = actual < expected;
            break;
          case '>=':
            conditionMet = actual >= expected;
            break;
          case '<=':
            conditionMet = actual <= expected;
            break;
        }
        
        if (conditionMet) {
          return condition.then;
        }
      }
      
      // Return else value or null
      return config.else || null;
    } catch (error) {
      logger.error(`Error applying conditional transformation:`, error);
      return null;
    }
  }

  /**
   * Execute a custom function for transformation
   */
  async executeFunction(
    functionName: string,
    value: any,
    params: any
  ): Promise<any> {
    try {
      // This is where you could implement a system for custom functions
      // For security reasons, you wouldn't want to eval arbitrary code
      // Instead, you could have a predefined set of functions
      
      switch (functionName) {
        case 'formatPhoneNumber':
          return this.formatPhoneNumber(value);
          
        case 'calculateTax':
          return this.calculateTax(value, params?.rate);
          
        case 'concatenate':
          return this.concatenate(value, params?.prefix, params?.suffix);
          
        default:
          logger.warn(`Unknown function: ${functionName}`);
          return value;
      }
    } catch (error) {
      logger.error(`Error executing function ${functionName}:`, error);
      return value;
    }
  }
  
  // Example predefined functions
  
  private formatPhoneNumber(phone: string): string {
    if (!phone || typeof phone !== 'string') return phone;
    
    // Strip non-numeric characters
    const digits = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX for US numbers
    if (digits.length === 10) {
      return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
    }
    
    return phone;
  }
  
  private calculateTax(amount: number, rate: number = 0.1): number {
    if (typeof amount !== 'number') return amount;
    return amount * (1 + rate);
  }
  
  private concatenate(value: string, prefix: string = '', suffix: string = ''): string {
    if (typeof value !== 'string') value = String(value);
    return `${prefix}${value}${suffix}`;
  }
}

// Export a singleton instance
export const transformationService = new TransformationService();
