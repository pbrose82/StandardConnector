import mongoose, { Document, Schema } from 'mongoose';

export interface ISyncRule extends Document {
  integrationId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  triggerEvent: string;
  condition?: string;
  action: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const syncRuleSchema = new Schema<ISyncRule>({
  integrationId: { type: Schema.Types.ObjectId, ref: 'Integration', required: true },
  name: { type: String, required: true },
  description: { type: String },
  triggerEvent: { type: String, required: true },
  condition: { type: String },
  action: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const SyncRule = mongoose.model<ISyncRule>('SyncRule', syncRuleSchema);
