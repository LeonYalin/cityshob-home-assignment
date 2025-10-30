import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { ValidationError } from '../errors';
import { Logger } from '../services/logger.service';

// Create a shared logger instance for validation middleware
const logger = new Logger('ZodValidation');

export const validateSchema = <
  TBody = any,
  TParams = any,
  TQuery = any
>(schemas: {
  body?: z.ZodSchema<TBody>;
  params?: z.ZodSchema<TParams>;
  query?: z.ZodSchema<TQuery>;
}) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // Validate request body
      if (schemas.body) {
        const validatedBody = await schemas.body.parseAsync(req.body);
        req.body = validatedBody;
        logger.debug('Request body validated successfully', { body: validatedBody });
      }

      // Validate request params
      if (schemas.params) {
        const validatedParams = await schemas.params.parseAsync(req.params);
        req.params = validatedParams as any;
        logger.debug('Request params validated successfully', { params: validatedParams });
      }

      // Validate request query
      if (schemas.query) {
        const validatedQuery = await schemas.query.parseAsync(req.query);
        req.query = validatedQuery as any;
        logger.debug('Request query validated successfully', { query: validatedQuery });
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue) => {
          const path = issue.path.join('.');
          return `${path}: ${issue.message}`;
        });
        
        logger.warn('Validation failed', { 
          errors: errorMessages,
          originalBody: req.body,
          originalParams: req.params,
          originalQuery: req.query 
        });
        
        const validationErrors = errorMessages.map(msg => ({ message: msg }));
        next(new ValidationError(validationErrors));
      } else {
        logger.error('Unexpected validation error', error);
        next(error);
      }
    }
  };
};