import { Request, Response, NextFunction } from 'express';
import { errorHandler } from './error-handler.middleware';
import { BaseError } from '../errors/base.error';
import { ValidationError } from '../errors/validation.error';
import { NotFoundError } from '../errors/not-found.error';

// Mock logger
jest.mock('../services/logger.service', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
}));

describe('ErrorHandler Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      method: 'GET',
      path: '/api/test',
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('BaseError handling', () => {
    it('should handle ValidationError', () => {
      const error = new ValidationError([
        { message: 'Email is required' },
        { message: 'Password must be at least 6 characters' },
      ]);

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errors: [
          { message: 'Email is required' },
          { message: 'Password must be at least 6 characters' },
        ],
      });
    });

    it('should handle NotFoundError', () => {
      const error = new NotFoundError('Todo not found');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        errors: [{ message: 'Todo not found' }],
      });
    });

    it('should handle custom BaseError', () => {
      class CustomError extends BaseError {
        statusCode = 403;
        message = 'Custom error message';
        constructor() {
          super('Custom error message');
          Object.setPrototypeOf(this, CustomError.prototype);
        }
        serializeErrors() {
          return [{ message: 'Custom error' }];
        }
      }

      const error = new CustomError();

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        errors: [{ message: 'Custom error' }],
      });
    });
  });

  describe('Generic error handling', () => {
    it('should handle generic Error in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Something went wrong');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        errors: [{ message: 'Something went wrong' }],
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should hide error details in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Internal database error');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        errors: [{ message: 'Something went wrong!' }],
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle errors without message', () => {
      const error = new Error();

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
    });
  });
});
