import mongoose, { Document, Schema } from 'mongoose';
import { MappingType } from '../core/mapping/mapping-types';

export interface IFieldMapping extends Document {
  mappingId: mongoose.Types.ObjectId;
  sourceFieldId: string;
  targetFieldId: string;
  sourceFieldPath: string;
  targetFieldPath: string;
  mappingType: MappingType;
  mappingConfig?: any;
  transformations?: any[];
  createdAt: Date;
  updatedAt: Date;
}

const fieldMappingSchema = new Schema<IFieldMapping>({
  mappingId: { type: Schema.Types.ObjectId, ref: 'Mapping', required: true },
  sourceFieldId: { type: String, required: true },
  targetFieldId: { type: String, required: true },
  sourceFieldPath: { type: String, required: true },
  targetFieldPath: { type: String, required: true },
  mappingType: { 
    type: String, 
    enum: Object.values(MappingType),
    default: MappingType.DIRECT
  },
  mappingConfig: { type: Schema.Types.Mixed },
  transformations: [{ type: Schema.Types.Mixed }],
}, { timestamps: true });

export const FieldMapping = mongoose.model<IFieldMapping>('FieldMapping', fieldMappingSchema);
