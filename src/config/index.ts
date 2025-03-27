import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '4000'),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/integration-platform',
  jwtSecret: process.env.JWT_SECRET || 'development-secret-key',
  environment: process.env.NODE_ENV || 'development',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Default timeout for connector API calls (10 seconds)
  connectorTimeoutMs: parseInt(process.env.CONNECTOR_TIMEOUT_MS || '10000'),
  
  // Maximum sync attempts before marking as failed
  maxSyncRetries: parseInt(process.env.MAX_SYNC_RETRIES || '3'),
  
  // Queue configuration
  queueEnabled: process.env.QUEUE_ENABLED === 'true',
  queueConcurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5'),
  
  // Webhook URL base (for registering callbacks to external systems)
  webhookBaseUrl: process.env.WEBHOOK_BASE_URL || 'https://integration-middleware.onrender.com/api/webhooks'
};
