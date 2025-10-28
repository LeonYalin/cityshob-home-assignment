import { Request, Response, NextFunction } from 'express';
import { BaseError } from '../errors/base.error';
import { Logger } from '../services/logger.service';

// Create a shared logger instance for error handling middleware
const logger = new Logger('ErrorHandler');

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error occurred:', err);

  if (err instanceof BaseError) {
    return res.status(err.statusCode).json({
      errors: err.serializeErrors(),
    });
  }

  // Handle generic errors
  res.status(500).json({
    errors: [
      {
        message: process.env.NODE_ENV === 'production' 
          ? 'Something went wrong!' 
          : err.message,
      },
    ],
  });
};