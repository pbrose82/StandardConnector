import mongoose, { Document, Schema } from 'mongoose';

export interface IMapping extends Document {
  integrationId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  sourceEntityId: string;
  targetEntityId: string;
  filterCondition?: string;
  sourceKeyField: string;
  targetKeyField: string;
  lastSyncAt?: Date;
  recordsProcessed?: number;
  recordsSucceeded?: number;
  recordsFailed?: number;
  createdAt: Date;
  updatedAt: Date;
}

const mappingSchema = new Schema<IMapping>({
  integrationId: { type: Schema.Types.ObjectId, ref: 'Integration', required: true },
  name: { type: String, required: true },
  description: { type: String },
  sourceEntityId: { type: String, required: true },
  targetEntityId: { type: String, required: true },
  filterCondition: { type: String },
  sourceKeyField: { type: String, required: true },
  targetKeyField: { type: String, required: true },
  lastSyncAt: { type: Date },
  recordsProcessed: { type: Number },
  recordsSucceeded: { type: Number },
  recordsFailed: { type: Number },
}, { timestamps: true });

export const Mapping = mongoose.model<IMapping>('Mapping', mappingSchema);
