import { Router } from 'express';
import integrationRoutes from './integration.routes';
import connectorRoutes from './connector.routes';
import mappingRoutes from './mapping.routes';
import syncRoutes from './sync.routes';
import webhookRoutes from './webhook.routes';

const router = Router();

router.use('/integrations', integrationRoutes);
router.use('/connectors', connectorRoutes);
router.use('/mappings', mappingRoutes);
router.use('/sync', syncRoutes);
router.use('/webhooks', webhookRoutes);

export default router;
