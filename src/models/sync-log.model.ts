// src/models/sync-log.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface ISyncLog extends Document {
  integrationId: mongoose.Types.ObjectId;
  integrationType?: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed';
  recordsProcessed?: number;
  recordsSucceeded?: number;
  recordsFailed?: number;
  error?: string;
  details?: any;
  createdAt: Date;
  updatedAt: Date;
}

const syncLogSchema = new Schema<ISyncLog>({
  integrationId: { type: Schema.Types.ObjectId, ref: 'Integration', required: true },
  integrationType: { type: String },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  status: { 
    type: String, 
    enum: ['running', 'completed', 'failed'],
    default: 'running'
  },
  recordsProcessed: { type: Number },
  recordsSucceeded: { type: Number },
  recordsFailed: { type: Number },
  error: { type: String },
  details: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const SyncLog = mongoose.model<ISyncLog>('SyncLog', syncLogSchema);
