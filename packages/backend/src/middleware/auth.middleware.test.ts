import { Request, Response, NextFunction } from 'express';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { ValidationError } from '../errors';

// Mock the auth service instance
jest.mock('../services/instances', () => ({
  authService: {
    verifyToken: jest.fn(),
  }
}));

describe('Auth Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let mockAuthService: any;

  beforeEach(() => {
    // Get the mocked authService
    const { authService } = require('../services/instances');
    mockAuthService = authService;
    
    jest.clearAllMocks();

    req = {
      headers: {},
      cookies: {},
      user: undefined
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate valid token from cookie', async () => {
      const mockUser = { 
        userId: 'test-user-id', 
        username: 'testuser',
        email: 'test@example.com' 
      };
      req.cookies = { auth_token: 'valid-token' };
      
      mockAuthService.verifyToken = jest.fn().mockReturnValue(mockUser);

      await AuthMiddleware.authenticate(req as Request, res as Response, next);

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should reject request without authentication cookie', async () => {
      await AuthMiddleware.authenticate(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(mockAuthService.verifyToken).not.toHaveBeenCalled();
    });

    it('should reject request with empty cookie', async () => {
      req.cookies = { auth_token: '' };

      await AuthMiddleware.authenticate(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(mockAuthService.verifyToken).not.toHaveBeenCalled();
    });

    it('should handle token verification errors', async () => {
      req.cookies = { auth_token: 'invalid-token' };
      
      const tokenError = new Error('Invalid token');
      mockAuthService.verifyToken = jest.fn().mockImplementation(() => {
        throw tokenError;
      });

      await AuthMiddleware.authenticate(req as Request, res as Response, next);

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('invalid-token');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('optionalAuthenticate', () => {
    it('should authenticate valid token when provided in cookie', async () => {
      const mockUser = { 
        userId: 'test-user-id', 
        username: 'testuser',
        email: 'test@example.com' 
      };
      req.cookies = { auth_token: 'valid-token' };
      
      mockAuthService.verifyToken = jest.fn().mockReturnValue(mockUser);

      await AuthMiddleware.optionalAuthenticate(req as Request, res as Response, next);

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should proceed without user when no authentication cookie', async () => {
      await AuthMiddleware.optionalAuthenticate(req as Request, res as Response, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(mockAuthService.verifyToken).not.toHaveBeenCalled();
    });

    it('should proceed without user when cookie is empty', async () => {
      req.cookies = { auth_token: '' };

      await AuthMiddleware.optionalAuthenticate(req as Request, res as Response, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(mockAuthService.verifyToken).not.toHaveBeenCalled();
    });

    it('should proceed without user when token verification fails', async () => {
      req.cookies = { auth_token: 'invalid-token' };
      
      mockAuthService.verifyToken = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await AuthMiddleware.optionalAuthenticate(req as Request, res as Response, next);

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('invalid-token');
      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });
});