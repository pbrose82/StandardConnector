import { Router, Request, Response } from 'express';
import { syncManager } from '../../core/sync/sync-manager';
import { SyncLog } from '../../models/sync-log.model';
import { logger } from '../../utils/logger';

const router = Router();

// Trigger manual sync for an integration
router.post('/integration/:integrationId', async (req: Request, res: Response) => {
  try {
    logger.info(`Triggering sync for integration ${req.params.integrationId}`);
    
    // Start sync in background and return immediately
    syncManager.syncIntegration(req.params.integrationId)
      .then(() => logger.info(`Sync completed for integration ${req.params.integrationId}`))
      .catch(err => logger.error(`Sync failed for integration ${req.params.integrationId}:`, err));
    
    res.json({ 
      message: 'Sync initiated', 
      integrationId: req.params.integrationId,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error(`Error initiating sync for integration ${req.params.integrationId}:`, error);
    res.status(500).json({ message: 'Error initiating sync' });
  }
});

// Get sync logs for an integration
router.get('/logs/integration/:integrationId', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const logs = await SyncLog.find({ integrationId: req.params.integrationId })
      .sort({ startTime: -1 })
      .limit(limit);
    
    res.json(logs);
  } catch (error) {
    logger.error(`Error fetching sync logs for integration ${req.params.integrationId}:`, error);
    res.status(500).json({ message: 'Error fetching sync logs' });
  }
});

// Get sync log by ID
router.get('/logs/:id', async (req: Request, res: Response) => {
  try {
    const log = await SyncLog.findById(req.params.id);
    
    if (!log) {
      return res.status(404).json({ message: 'Sync log not found' });
    }
    
    res.json(log);
  } catch (error) {
    logger.error(`Error fetching sync log ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error fetching sync log' });
  }
});

export default router;
