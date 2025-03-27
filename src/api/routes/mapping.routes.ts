import { Router, Request, Response } from 'express';
import { Mapping } from '../../models/mapping.model';
import { FieldMapping } from '../../models/field-mapping.model';
import { logger } from '../../utils/logger';

const router = Router();

// Get all mappings for an integration
router.get('/integration/:integrationId', async (req: Request, res: Response) => {
  try {
    const mappings = await Mapping.find({ integrationId: req.params.integrationId });
    res.json(mappings);
  } catch (error) {
    logger.error(`Error fetching mappings for integration ${req.params.integrationId}:`, error);
    res.status(500).json({ message: 'Error fetching mappings' });
  }
});

// Get mapping by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const mapping = await Mapping.findById(req.params.id);
    
    if (!mapping) {
      return res.status(404).json({ message: 'Mapping not found' });
    }
    
    res.json(mapping);
  } catch (error) {
    logger.error(`Error fetching mapping ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error fetching mapping' });
  }
});

// Create new mapping
router.post('/', async (req: Request, res: Response) => {
  try {
    const mapping = new Mapping(req.body);
    const savedMapping = await mapping.save();
    
    logger.info(`Created mapping ${savedMapping._id}`);
    res.status(201).json(savedMapping);
  } catch (error) {
    logger.error('Error creating mapping:', error);
    res.status(400).json({ message: 'Error creating mapping', error: error.message });
  }
});

// Update mapping
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const mapping = await Mapping.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!mapping) {
      return res.status(404).json({ message: 'Mapping not found' });
    }
    
    logger.info(`Updated mapping ${mapping._id}`);
    res.json(mapping);
  } catch (error) {
    logger.error(`Error updating mapping ${req.params.id}:`, error);
    res.status(400).json({ message: 'Error updating mapping', error: error.message });
  }
});

// Delete mapping
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const mapping = await Mapping.findByIdAndDelete(req.params.id);
    
    if (!mapping) {
      return res.status(404).json({ message: 'Mapping not found' });
    }
    
    // Also delete related field mappings
    await FieldMapping.deleteMany({ mappingId: req.params.id });
    
    logger.info(`Deleted mapping ${req.params.id}`);
    res.json({ message: 'Mapping deleted' });
  } catch (error) {
    logger.error(`Error deleting mapping ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error deleting mapping' });
  }
});

// Get field mappings for a mapping
router.get('/:mappingId/fields', async (req: Request, res: Response) => {
  try {
    const fieldMappings = await FieldMapping.find({ mappingId: req.params.mappingId });
    res.json(fieldMappings);
  } catch (error) {
    logger.error(`Error fetching field mappings for mapping ${req.params.mappingId}:`, error);
    res.status(500).json({ message: 'Error fetching field mappings' });
  }
});

// Create field mapping
router.post('/:mappingId/fields', async (req: Request, res: Response) => {
  try {
    const fieldMapping = new FieldMapping({
      mappingId: req.params.mappingId,
      ...req.body
    });
    
    const savedFieldMapping = await fieldMapping.save();
    
    logger.info(`Created field mapping ${savedFieldMapping._id}`);
    res.status(201).json(savedFieldMapping);
  } catch (error) {
    logger.error(`Error creating field mapping for mapping ${req.params.mappingId}:`, error);
    res.status(400).json({ message: 'Error creating field mapping', error: error.message });
  }
});

// Update field mapping
router.put('/fields/:id', async (req: Request, res: Response) => {
  try {
    const fieldMapping = await FieldMapping.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!fieldMapping) {
      return res.status(404).json({ message: 'Field mapping not found' });
    }
    
    logger.info(`Updated field mapping ${fieldMapping._id}`);
    res.json(fieldMapping);
  } catch (error) {
    logger.error(`Error updating field mapping ${req.params.id}:`, error);
    res.status(400).json({ message: 'Error updating field mapping', error: error.message });
  }
});

// Delete field mapping
router.delete('/fields/:id', async (req: Request, res: Response) => {
  try {
    const fieldMapping = await FieldMapping.findByIdAndDelete(req.params.id);
    
    if (!fieldMapping) {
      return res.status(404).json({ message: 'Field mapping not found' });
    }
    
    logger.info(`Deleted field mapping ${req.params.id}`);
    res.json({ message: 'Field mapping deleted' });
  } catch (error) {
    logger.error(`Error deleting field mapping ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error deleting field mapping' });
  }
});

export default router;
