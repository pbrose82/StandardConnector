export enum MappingType {
  DIRECT = 'direct',
  COMPOSITE = 'composite',
  SPLIT = 'split',
  CONDITIONAL = 'conditional',
  LOOKUP = 'lookup',
  DEFAULT_VALUE = 'default_value',
  CUSTOM_FUNCTION = 'custom_function'
}

export interface MappingConfig {
  // For COMPOSITE mapping
  sourceFields?: string[];
  separator?: string;
  
  // For CONDITIONAL mapping
  conditions?: {
    when: string;
    then: string;
    else?: string;
  }[];
  
  // For LOOKUP mapping
  lookupEntity?: string;
  lookupField?: string;
  targetField?: string;
  
  // For DEFAULT_VALUE mapping
  defaultValue?: any;
  
  // For CUSTOM_FUNCTION mapping
  function?: string;
  params?: any;
}

export interface TransformationConfig {
  type: string;
  config: any;
}

export interface FieldMappingDTO {
  id: string;
  mappingId: string;
  sourceFieldId: string;
  targetFieldId: string;
  sourceFieldPath: string;
  targetFieldPath: string;
  mappingType: MappingType;
  mappingConfig?: MappingConfig;
  transformations?: TransformationConfig[];
}
