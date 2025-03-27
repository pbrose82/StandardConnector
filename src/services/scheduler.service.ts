import cron from 'node-cron';
import { Integration } from '../models/integration.model';
import { syncManager } from '../core/sync/sync-manager';
import { logger } from '../utils/logger';

class SchedulerService {
  private tasks: Map<string, cron.ScheduledTask> = new Map();
  
  constructor() {}
  
  async initializeScheduler() {
    try {
      logger.info('Initializing scheduler');
      
      // Get all active integrations
      const integrations = await Integration.find({ status: 'active' });
      
      // Schedule each integration
      for (const integration of integrations) {
        this.scheduleIntegration(integration);
      }
      
      logger.info(`Scheduled ${integrations.length} integrations`);
    } catch (error) {
      logger.error('Error initializing scheduler:', error);
    }
  }
  
  scheduleIntegration(integration: any) {
    // Cancel existing task if it exists
    if (this.tasks.has(integration._id.toString())) {
      this.tasks.get(integration._id.toString())?.stop();
      this.tasks.delete(integration._id.toString());
    }
    
    // Skip if real-time or manual sync
    if (integration.syncFrequency === 'realtime' || integration.syncFrequency === 'manual') {
      logger.info(`Skipping scheduler for integration ${integration._id} (${integration.syncFrequency})`);
      return;
    }
    
    // Determine cron expression based on frequency
    let cronExpression;
    switch (integration.syncFrequency) {
      case 'minutes_5':
        cronExpression = '*/5 * * * *';
        break;
      case 'minutes_15':
        cronExpression = '*/15 * * * *';
        break;
      case 'hourly':
        cronExpression = '0 * * * *';
        break;
      case 'daily':
        cronExpression = '0 0 * * *';
        break;
      default:
        cronExpression = '0 * * * *'; // Default to hourly
    }
    
    logger.info(`Scheduling integration ${integration._id} with cron: ${cronExpression}`);
    
    // Schedule the task
    const task = cron.schedule(cronExpression, async () => {
      try {
        logger.info(`Running scheduled sync for integration ${integration._id}`);
        await syncManager.syncIntegration(integration._id.toString());
        logger.info(`Scheduled sync completed for integration ${integration._id}`);
      } catch (error) {
        logger.error(`Scheduled sync failed for integration ${integration._id}:`, error);
      }
    });
    
    this.tasks.set(integration._id.toString(), task);
  }
  
  unscheduleIntegration(integrationId: string) {
    if (this.tasks.has(integrationId)) {
      logger.info(`Unscheduling integration ${integrationId}`);
      this.tasks.get(integrationId)?.stop();
      this.tasks.delete(integrationId);
    }
  }
  
  rescheduleAll() {
    logger.info('Rescheduling all integrations');
    
    // Stop all existing tasks
    for (const [id, task] of this.tasks.entries()) {
      task.stop();
      this.tasks.delete(id);
    }
    
    // Re-initialize
    this.initializeScheduler();
  }
}

// Export a singleton instance
export const schedulerService = new SchedulerService();
