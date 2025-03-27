import app from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { schedulerService } from './services/scheduler.service';

const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${config.environment} mode`);
  
  // Initialize scheduler for periodic syncs
  if (config.environment === 'production') {
    schedulerService.initializeScheduler()
      .then(() => logger.info('Scheduler initialized successfully'))
      .catch(err => logger.error('Failed to initialize scheduler', err));
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in this case, just log
});
