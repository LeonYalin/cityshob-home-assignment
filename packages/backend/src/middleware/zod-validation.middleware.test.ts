import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateSchema } from './zod-validation.middleware';
import { ValidationError } from '../errors';

// Mock logger
jest.mock('../services/logger.service', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
}));

describe('Zod Validation Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      query: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  describe('Body validation', () => {
    const bodySchema = z.object({
      title: z.string().min(1, 'Title is required'),
      description: z.string().optional(),
      completed: z.boolean().optional(),
    });

    it('should validate valid body successfully', async () => {
      req.body = {
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
      };

      const middleware = validateSchema({ body: bodySchema });
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.body).toEqual({
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
      });
    });

    it('should pass validation when optional fields are missing', async () => {
      req.body = {
        title: 'Test Todo',
      };

      const middleware = validateSchema({ body: bodySchema });
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.body.title).toBe('Test Todo');
    });

    it('should fail validation when required field is missing', async () => {
      req.body = {
        description: 'Test Description',
      };

      const middleware = validateSchema({ body: bodySchema });
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = (next as jest.Mock).mock.calls[0][0] as ValidationError;
      expect(error.serializeErrors()[0].message).toContain('title');
    });

    it('should fail validation with incorrect type', async () => {
      req.body = {
        title: 'Test Todo',
        completed: 'yes', // should be boolean
      };

      const middleware = validateSchema({ body: bodySchema });
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should strip unknown fields', async () => {
      req.body = {
        title: 'Test Todo',
        unknownField: 'Should be removed',
      };

      const middleware = validateSchema({ body: bodySchema });
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.body).not.toHaveProperty('unknownField');
    });
  });

  describe('Params validation', () => {
    const paramsSchema = z.object({
      id: z.string().uuid('Invalid ID format'),
    });

    it('should validate valid params successfully', async () => {
      req.params = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      };

      const middleware = validateSchema({ params: paramsSchema });
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should fail validation with invalid UUID', async () => {
      req.params = {
        id: 'invalid-uuid',
      };

      const middleware = validateSchema({ params: paramsSchema });
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = (next as jest.Mock).mock.calls[0][0] as ValidationError;
      expect(error.serializeErrors()[0].message).toContain('id');
    });
  });

  describe('Query validation', () => {
    const querySchema = z.object({
      page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
      limit: z.string().transform(Number).pipe(z.number().max(100)).optional(),
      status: z.enum(['active', 'completed', 'all']).optional(),
    });

    it('should validate valid query parameters', async () => {
      req.query = {
        page: '1',
        limit: '10',
        status: 'active',
      };

      const middleware = validateSchema({ query: querySchema });
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should transform string numbers to numbers', async () => {
      req.query = {
        page: '2',
        limit: '20',
      };

      const middleware = validateSchema({ query: querySchema });
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect(typeof (req.query as any).page).toBe('number');
      expect(typeof (req.query as any).limit).toBe('number');
    });

    it('should fail validation with invalid enum value', async () => {
      req.query = {
        status: 'invalid',
      };

      const middleware = validateSchema({ query: querySchema });
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('Multiple schema validation', () => {
    const bodySchema = z.object({
      title: z.string(),
    });

    const paramsSchema = z.object({
      id: z.string(),
    });

    const querySchema = z.object({
      include: z.string().optional(),
    });

    it('should validate all schemas successfully', async () => {
      req.body = { title: 'Test' };
      req.params = { id: '123' };
      req.query = { include: 'details' };

      const middleware = validateSchema({
        body: bodySchema,
        params: paramsSchema,
        query: querySchema,
      });

      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should fail if any schema validation fails', async () => {
      req.body = { title: 'Test' };
      req.params = {}; // Missing id
      req.query = { include: 'details' };

      const middleware = validateSchema({
        body: bodySchema,
        params: paramsSchema,
        query: querySchema,
      });

      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('Error handling', () => {
    it('should handle unexpected errors', async () => {
      const brokenSchema = {
        parseAsync: jest.fn().mockRejectedValue(new Error('Unexpected error')),
      };

      req.body = { title: 'Test' };

      const middleware = validateSchema({ body: brokenSchema as any });
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next).not.toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should include field path in error message', async () => {
      const nestedSchema = z.object({
        user: z.object({
          email: z.string().email('Invalid email'),
        }),
      });

      req.body = {
        user: {
          email: 'invalid-email',
        },
      };

      const middleware = validateSchema({ body: nestedSchema });
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = (next as jest.Mock).mock.calls[0][0] as ValidationError;
      expect(error.serializeErrors()[0].message).toContain('user.email');
    });
  });

  describe('Logging', () => {
    it('should log validation success', async () => {
      const bodySchema = z.object({ title: z.string() });
      req.body = { title: 'Test' };

      const middleware = validateSchema({ body: bodySchema });
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      // Logger debug is called internally, we just verify the validation passed
    });

    it('should log validation failures', async () => {
      const bodySchema = z.object({ title: z.string() });
      req.body = {}; // Missing title

      const middleware = validateSchema({ body: bodySchema });
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      // Logger warn is called internally, we just verify the validation failed
    });
  });
});
