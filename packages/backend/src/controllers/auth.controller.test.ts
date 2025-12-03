import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../errors';
import type { AuthResponse } from '../services/auth.service';

// Mock app.config first
jest.mock('../config/app.config', () => ({
  __esModule: true,
  default: {
    jwtSecret: 'test-secret-key',
    jwtExpiresIn: '7d',
    cookieSecure: false,
    cookieSameSite: 'lax' as const,
    cookieMaxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

// Mock authService
const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  verifyToken: jest.fn(),
  getUserById: jest.fn(),
};

// Mock app module
jest.mock('../app', () => ({
  authService: mockAuthService,
}));

// Now import controller after mocks
import { authController } from './auth.controller';
import appConfig from '../config/app.config';

describe('AuthController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      cookies: {},
      user: undefined,
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockAuthResponse: AuthResponse = {
        user: {
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        token: 'mock-jwt-token',
      };

      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      await authController.register(req as Request, res as Response, next);

      expect(mockAuthService.register).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(res.cookie).toHaveBeenCalledWith('auth_token', 'mock-jwt-token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: 'user-123',
            username: 'testuser',
            email: 'test@example.com',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when username is missing', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      await authController.register(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed',
        })
      );
      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when email is missing', async () => {
      req.body = {
        username: 'testuser',
        password: 'password123',
      };

      await authController.register(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed',
        })
      );
      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when password is missing', async () => {
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
      };

      await authController.register(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed',
        })
      );
      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const error = new Error('User already exists');
      mockAuthService.register.mockRejectedValue(error);

      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      await authController.register(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockAuthResponse: AuthResponse = {
        user: {
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        token: 'mock-jwt-token',
      };

      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      req.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      await authController.login(req as Request, res as Response, next);

      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(res.cookie).toHaveBeenCalledWith('auth_token', 'mock-jwt-token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: 'user-123',
            username: 'testuser',
            email: 'test@example.com',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when email is missing', async () => {
      req.body = {
        password: 'password123',
      };

      await authController.login(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed',
        })
      );
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when password is missing', async () => {
      req.body = {
        email: 'test@example.com',
      };

      await authController.login(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed',
        })
      );
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should handle invalid credentials error', async () => {
      const error = new ValidationError([{ message: 'Invalid email or password' }]);
      mockAuthService.login.mockRejectedValue(error);

      req.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      await authController.login(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      await authController.logout(req as Request, res as Response, next);

      expect(res.clearCookie).toHaveBeenCalledWith('auth_token', {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        path: '/',
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logout successful',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle logout errors', async () => {
      const error = new Error('Unexpected error');
      (res.clearCookie as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await authController.logout(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user when authenticated', async () => {
      req.user = {
        userId: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      };

      const mockUser = {
        _id: 'user-123',
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockAuthService.getUserById = jest.fn().mockResolvedValue(mockUser);

      await authController.getCurrentUser(req as Request, res as Response, next);

      expect(mockAuthService.getUserById).toHaveBeenCalledWith('user-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User retrieved successfully',
        data: {
          user: {
            id: 'user-123',
            username: 'testuser',
            email: 'test@example.com',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when user is not authenticated', async () => {
      req.user = undefined;

      await authController.getCurrentUser(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed',
        })
      );
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      req.user = {
        userId: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      };

      const error = new Error('Database error');
      mockAuthService.getUserById = jest.fn().mockRejectedValue(error);

      await authController.getCurrentUser(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
