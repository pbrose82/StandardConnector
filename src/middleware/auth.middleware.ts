import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';

// Basic authentication middleware
export const authMiddleware = (
  req: Request & { userId?: string },
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
    
    // Add userId to request for downstream use
    req.userId = decoded.userId;
    
    next();
  } catch (error) {
    logger.warn('Authentication failed:', error.message);
    return res.status(401).json({ message: 'Authentication failed' });
  }
};
