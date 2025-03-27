import { Router, Request, Response } from 'express';
import { syncManager } from '../../core/sync/sync-manager';
import { logger } from '../../utils/logger';
import { getErrorMessage } from '../../utils/error-utils';

const router = Router();

// Handle webhook from external system
router.post('/:integrationId/:mappingId', async (req: Request, res: Response) => {
  try {
    logger.info(`Received webhook for integration ${req.params.integrationId}, mapping ${req.params.mappingId}`);
    
    // Log webhook payload for debugging
    logger.debug('Webhook payload:', req.body);
    
    // TODO: Verify webhook signature/secret
    
    // Acknowledge receipt immediately
    res.status(200).json({ received: true });
    
    // Process webhook in background
    // This would trigger a sync or process the specific record
    // Implementation depends on the specific webhook format and requirements
    syncManager.syncIntegration(req.params.integrationId)
      .then(() => logger.info(`Webhook sync completed for integration ${req.params.integrationId}`))
      .catch(err => logger.error(`Webhook sync failed for integration ${req.params.integrationId}:`, err));
  } catch (error) {
    logger.error(`Error processing webhook for integration ${req.params.integrationId}:`, error);
    
    // Still return 200 to acknowledge receipt (most webhook providers expect this)
    // but include error details
    res.status(200).json({ 
      received: true,
      processed: false,
      error: getErrorMessage(error)
    });
  }
});

export default router;
