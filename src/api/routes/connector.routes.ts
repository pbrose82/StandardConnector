import { Router, Request, Response } from 'express';
import { connectorRegistry } from '../../core/connector-registry.service';
import { logger } from '../../utils/logger';
import { getErrorMessage } from '../../utils/error-utils';

const router = Router();

// Get available connector types
router.get('/types', (req: Request, res: Response) => {
  try {
    const connectorTypes = connectorRegistry.getAvailableConnectorTypes();
    res.json(connectorTypes);
  } catch (error) {
    logger.error('Error fetching connector types:', error);
    res.status(500).json({ message: 'Error fetching connector types' });
  }
});

// Get connector auth methods
router.get('/:connectorId/auth-methods', (req: Request, res: Response) => {
  try {
    const connector = connectorRegistry.getConnector(req.params.connectorId);
    
    if (!connector) {
      return res.status(404).json({ message: 'Connector not found' });
    }
    
    const authMethods = connector.getSupportedAuthMethods();
    res.json(authMethods);
  } catch (error) {
    logger.error(`Error fetching auth methods for ${req.params.connectorId}:`, error);
    res.status(500).json({ message: 'Error fetching auth methods' });
  }
});

// Get connector entities
router.get('/:connectorId/entities', async (req: Request, res: Response) => {
  try {
    const connector = connectorRegistry.getConnector(req.params.connectorId);
    
    if (!connector) {
      return res.status(404).json({ message: 'Connector not found' });
    }
    
    // Note: In a real implementation, you would pass auth info here
    const entities = await connector.getEntities();
    res.json(entities);
  } catch (error) {
    logger.error(`Error fetching entities for ${req.params.connectorId}:`, error);
    res.status(500).json({ message: 'Error fetching entities' });
  }
});

// Get entity fields
router.get('/:connectorId/entities/:entityId/fields', async (req: Request, res: Response) => {
  try {
    const connector = connectorRegistry.getConnector(req.params.connectorId);
    
    if (!connector) {
      return res.status(404).json({ message: 'Connector not found' });
    }
    
    // Note: In a real implementation, you would pass auth info here
    const fields = await connector.getEntityFields(req.params.entityId);
    res.json(fields);
  } catch (error) {
    logger.error(`Error fetching fields for ${req.params.connectorId}/${req.params.entityId}:`, error);
    res.status(500).json({ message: 'Error fetching fields' });
  }
});

// Authenticate with connector
router.post('/:connectorId/authenticate', async (req: Request, res: Response) => {
  try {
    const connector = connectorRegistry.getConnector(req.params.connectorId);
    
    if (!connector) {
      return res.status(404).json({ message: 'Connector not found' });
    }
    
    const authResult = await connector.authenticate(req.body);
    
    // Important: In a real implementation, you should securely store the tokens
    // and not return sensitive information to the client
    res.json({
      success: true,
      expiresAt: authResult.expiresAt
    });
  } catch (error) {
    logger.error(`Error authenticating with ${req.params.connectorId}:`, error);
    res.status(401).json({ message: 'Authentication failed', error: getErrorMessage(error) });
  }
});

export default router;
