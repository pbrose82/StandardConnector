import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { config } from './config';
import { logger } from './utils/logger';
import routes from './api/routes';
import { errorMiddleware } from './middleware/error.middleware';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Database connection
mongoose.connect(config.mongodbUri)
  .then(() => logger.info('Connected to MongoDB'))
  .catch(err => logger.error('MongoDB connection error:', err));

// API routes
app.use('/api', routes);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'UP', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  });
});

// Debug endpoint (only in non-production)
if (config.environment !== 'production') {
  app.get('/debug', (req, res) => {
    res.json({
      environment: config.environment,
      mongoConnection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    });
  });
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Integration Platform API' });
});

// Error handling middleware
app.use(errorMiddleware);

// Handle 404s
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

export default app;
