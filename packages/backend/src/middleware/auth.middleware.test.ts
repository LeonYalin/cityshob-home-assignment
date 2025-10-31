import { Request, Response, NextFunction } from 'express';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { AuthService } from '../services/auth.service';
import { ValidationError } from '../errors';

// Mock AuthService
jest.mock('../services/auth.service');
const MockedAuthService = AuthService as jest.MockedClass<typeof AuthService>;

describe('Auth Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let mockAuthService: jest.Mocked<AuthService>;

  beforeEach(() => {
    req = {
      headers: {},
      user: undefined
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();

    // Create a mock instance
    mockAuthService = new MockedAuthService() as jest.Mocked<AuthService>;
    
    // Replace the static authService with our mock
    (AuthMiddleware as any).authService = mockAuthService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate valid token', async () => {
      const mockUser = { 
        userId: 'test-user-id', 
        username: 'testuser',
        email: 'test@example.com' 
      };
      req.headers = { authorization: 'Bearer valid-token' };
      
      mockAuthService.verifyToken = jest.fn().mockReturnValue(mockUser);

      await AuthMiddleware.authenticate(req as Request, res as Response, next);

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should reject request without authorization header', async () => {
      await AuthMiddleware.authenticate(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(mockAuthService.verifyToken).not.toHaveBeenCalled();
    });

    it('should reject request with malformed authorization header', async () => {
      req.headers = { authorization: 'InvalidFormat' };

      await AuthMiddleware.authenticate(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(mockAuthService.verifyToken).not.toHaveBeenCalled();
    });

    it('should reject request with missing Bearer prefix', async () => {
      req.headers = { authorization: 'valid-token' };

      await AuthMiddleware.authenticate(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(mockAuthService.verifyToken).not.toHaveBeenCalled();
    });

    it('should handle token verification errors', async () => {
      req.headers = { authorization: 'Bearer invalid-token' };
      
      const tokenError = new Error('Invalid token');
      mockAuthService.verifyToken = jest.fn().mockImplementation(() => {
        throw tokenError;
      });

      await AuthMiddleware.authenticate(req as Request, res as Response, next);

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('invalid-token');
      expect(next).toHaveBeenCalled();
    });

    it('should reject empty token after Bearer prefix', async () => {
      req.headers = { authorization: 'Bearer ' };

      await AuthMiddleware.authenticate(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(mockAuthService.verifyToken).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuthenticate', () => {
    it('should authenticate valid token when provided', async () => {
      const mockUser = { 
        userId: 'test-user-id', 
        username: 'testuser',
        email: 'test@example.com' 
      };
      req.headers = { authorization: 'Bearer valid-token' };
      
      mockAuthService.verifyToken = jest.fn().mockReturnValue(mockUser);

      await AuthMiddleware.optionalAuthenticate(req as Request, res as Response, next);

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should proceed without user when no authorization header', async () => {
      await AuthMiddleware.optionalAuthenticate(req as Request, res as Response, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(mockAuthService.verifyToken).not.toHaveBeenCalled();
    });

    it('should proceed without user when malformed authorization header', async () => {
      req.headers = { authorization: 'InvalidFormat' };

      await AuthMiddleware.optionalAuthenticate(req as Request, res as Response, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(mockAuthService.verifyToken).not.toHaveBeenCalled();
    });

    it('should proceed without user when token verification fails', async () => {
      req.headers = { authorization: 'Bearer invalid-token' };
      
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