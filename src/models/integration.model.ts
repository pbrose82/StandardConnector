import mongoose, { Document, Schema } from 'mongoose';

export interface IIntegration extends Document {
  name: string;
  description?: string;
  sourceConnectorId: string;
  targetConnectorId: string;
  status: 'draft' | 'active' | 'paused' | 'error';
  syncDirection: 'source_to_target' | 'target_to_source' | 'bidirectional';
  syncFrequency: 'realtime' | 'minutes_5' | 'minutes_15' | 'hourly' | 'daily' | 'manual';
  lastSyncAt?: Date;
  sourceAuth?: any;
  targetAuth?: any;
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const integrationSchema = new Schema<IIntegration>({
  name: { type: String, required: true },
  description: { type: String },
  sourceConnectorId: { type: String, required: true },
  targetConnectorId: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['draft', 'active', 'paused', 'error'], 
    default: 'draft' 
  },
  syncDirection: { 
    type: String, 
    enum: ['source_to_target', 'target_to_source', 'bidirectional'], 
    default: 'bidirectional' 
  },
  syncFrequency: { 
    type: String, 
    enum: ['realtime', 'minutes_5', 'minutes_15', 'hourly', 'daily', 'manual'], 
    default: 'minutes_15' 
  },
  lastSyncAt: { type: Date },
  sourceAuth: { type: Schema.Types.Mixed },
  targetAuth: { type: Schema.Types.Mixed },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export const Integration = mongoose.model<IIntegration>('Integration', integrationSchema);
