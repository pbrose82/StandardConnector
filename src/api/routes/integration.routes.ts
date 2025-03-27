import { Router, Request, Response } from 'express';
import { Integration } from '../../models/integration.model';
import { logger } from '../../utils/logger';
import { getErrorMessage } from '../../utils/error-utils';

const router = Router();

// Get all integrations
router.get('/', async (req: Request, res: Response) => {
  try {
    const integrations = await Integration.find();
    res.json(integrations);
  } catch (error) {
    logger.error('Error fetching integrations:', error);
    res.status(500).json({ message: 'Error fetching integrations' });
  }
});

// Get integration by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const integration = await Integration.findById(req.params.id);
    
    if (!integration) {
      return res.status(404).json({ message: 'Integration not found' });
    }
    
    res.json(integration);
  } catch (error) {
    logger.error(`Error fetching integration ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error fetching integration' });
  }
});

// Create new integration
router.post('/', async (req: Request, res: Response) => {
  try {
    const integration = new Integration(req.body);
    const savedIntegration = await integration.save();
    
    logger.info(`Created integration ${savedIntegration._id}`);
    res.status(201).json(savedIntegration);
  } catch (error) {
    logger.error('Error creating integration:', error);
    res.status(400).json({ message: 'Error creating integration', error: getErrorMessage(error) });
  }
});

// Update integration
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const integration = await Integration.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!integration) {
      return res.status(404).json({ message: 'Integration not found' });
    }
    
    logger.info(`Updated integration ${integration._id}`);
    res.json(integration);
  } catch (error) {
    logger.error(`Error updating integration ${req.params.id}:`, error);
    res.status(400).json({ message: 'Error updating integration', error: getErrorMessage(error) });
  }
});

// Delete integration
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const integration = await Integration.findByIdAndDelete(req.params.id);
    
    if (!integration) {
      return res.status(404).json({ message: 'Integration not found' });
    }
    
    logger.info(`Deleted integration ${req.params.id}`);
    res.json({ message: 'Integration deleted' });
  } catch (error) {
    logger.error(`Error deleting integration ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error deleting integration' });
  }
});

export default router;
