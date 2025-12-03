import { UserModel } from '../models/user.model';
import { InMemoryUserStore } from '../repositories/in-memory-user.repository';
import { ValidationError } from '../errors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Mock dependencies FIRST
jest.mock('../models/user.model');
jest.mock('../repositories/in-memory-user.repository');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

// Mock app module
jest.mock('../app', () => ({
  databaseService: {
    getConnectionStatus: jest.fn(),
  },
}));

// Mock logger
jest.mock('./logger.service', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
}));

// Mock app.config
jest.mock('../config/app.config', () => ({
  default: {
    jwtSecret: 'test-secret-key',
    jwtExpiresIn: '7d',
  },
}));

// Import AuthService AFTER all mocks are defined
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;
  let mockDatabaseService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    const { databaseService } = require('../app');
    mockDatabaseService = databaseService;

    authService = new AuthService();
  });

  describe('register', () => {
    const registerData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    describe('with MongoDB connection', () => {
      beforeEach(() => {
        mockDatabaseService.getConnectionStatus.mockReturnValue(true);
      });

      it('should register a new user successfully', async () => {
        const mockUser = {
          _id: 'user-123',
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          password: 'hashed-password',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          save: jest.fn().mockResolvedValue(undefined),
        };

        (UserModel.findOne as jest.Mock).mockResolvedValue(null);
        (UserModel as any).mockImplementation(() => mockUser);
        (jwt.sign as jest.Mock).mockReturnValue('mock-token');

        const result = await authService.register(registerData);

        expect(UserModel.findOne).toHaveBeenCalledWith({
          $or: [
            { email: 'test@example.com' },
            { username: 'testuser' }
          ]
        });
        expect(mockUser.save).toHaveBeenCalled();
        expect(jwt.sign).toHaveBeenCalled();
        expect(result.user).toMatchObject({
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
        });
        expect(result.token).toBe('mock-token');
      });

      it('should throw ValidationError when user already exists', async () => {
        const existingUser = { 
          email: 'test@example.com',
          username: 'testuser'
        };
        (UserModel.findOne as jest.Mock).mockResolvedValue(existingUser);

        await expect(authService.register(registerData)).rejects.toThrow(ValidationError);

        expect(jwt.sign).not.toHaveBeenCalled();
      });

      it('should handle database errors', async () => {
        const dbError = new Error('Database connection failed');
        (UserModel.findOne as jest.Mock).mockRejectedValue(dbError);

        await expect(authService.register(registerData)).rejects.toThrow(dbError);
      });
    });

    describe('with in-memory fallback', () => {
      beforeEach(() => {
        mockDatabaseService.getConnectionStatus.mockReturnValue(false);
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
        (jwt.sign as jest.Mock).mockReturnValue('mock-token');
      });

      it('should register user in memory successfully', async () => {
        const mockUser = {
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          password: 'hashed-password',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        };

        (InMemoryUserStore.getInstance as jest.Mock).mockReturnValue({
          findOne: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue(mockUser),
        });
        (jwt.sign as jest.Mock).mockReturnValue('mock-token');

        const result = await authService.register(registerData);

        expect(result.user).toMatchObject({
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
        });
        expect(result.token).toBe('mock-token');
      });

      it('should throw ValidationError when user exists in memory', async () => {
        const existingUser = { email: 'test@example.com' };
        
        (InMemoryUserStore.getInstance as jest.Mock).mockReturnValue({
          findOne: jest.fn().mockResolvedValue(existingUser),
          create: jest.fn(),
        });

        await expect(authService.register(registerData)).rejects.toThrow(ValidationError);
      });
    });
  });

  describe('login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    describe('with MongoDB connection', () => {
      beforeEach(() => {
        mockDatabaseService.getConnectionStatus.mockReturnValue(true);
      });

      it('should login user successfully', async () => {
        const mockUser = {
          _id: 'user-123',
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          password: 'hashed-password',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          comparePassword: jest.fn().mockResolvedValue(true),
          toObject: jest.fn().mockReturnValue({
            _id: 'user-123',
            username: 'testuser',
            email: 'test@example.com',
          }),
        };

        (UserModel.findOne as jest.Mock).mockReturnValue({
          select: jest.fn().mockResolvedValue(mockUser)
        });
        (jwt.sign as jest.Mock).mockReturnValue('mock-token');

        const result = await authService.login(loginData);

        expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
        expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
        expect(jwt.sign).toHaveBeenCalled();
        expect(result.user).toMatchObject({
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
        });
        expect(result.token).toBe('mock-token');
      });

      it('should throw ValidationError when user not found', async () => {
        (UserModel.findOne as jest.Mock).mockReturnValue({
          select: jest.fn().mockResolvedValue(null)
        });

        await expect(authService.login(loginData)).rejects.toThrow(ValidationError);
      });

      it('should throw ValidationError when password is incorrect', async () => {
        const mockUser = {
          comparePassword: jest.fn().mockResolvedValue(false),
        };

        (UserModel.findOne as jest.Mock).mockReturnValue({
          select: jest.fn().mockResolvedValue(mockUser)
        });

        await expect(authService.login(loginData)).rejects.toThrow(ValidationError);
      });
    });

    describe('with in-memory fallback', () => {
      beforeEach(() => {
        mockDatabaseService.getConnectionStatus.mockReturnValue(false);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (jwt.sign as jest.Mock).mockReturnValue('mock-token');
      });

      it('should login user from memory successfully', async () => {
        const mockUser = {
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          password: 'hashed-password',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          comparePassword: jest.fn().mockResolvedValue(true),
        };

        (InMemoryUserStore.getInstance as jest.Mock).mockReturnValue({
          findOne: jest.fn().mockResolvedValue(mockUser),
        });
        (jwt.sign as jest.Mock).mockReturnValue('mock-token');

        const result = await authService.login(loginData);

        expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
        expect(result.user).toMatchObject({
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
        });
        expect(result.token).toBe('mock-token');
      });

      it('should throw ValidationError when user not found in memory', async () => {
        (InMemoryUserStore.getInstance as jest.Mock).mockReturnValue({
          findOne: jest.fn().mockResolvedValue(null),
        });

        await expect(authService.login(loginData)).rejects.toThrow(ValidationError);
      });

      it('should throw ValidationError when password is incorrect in memory', async () => {
        const mockUser = {
          password: 'hashed-password',
          comparePassword: jest.fn().mockResolvedValue(false),
        };

        (InMemoryUserStore.getInstance as jest.Mock).mockReturnValue({
          findOne: jest.fn().mockResolvedValue(mockUser),
        });

        await expect(authService.login(loginData)).rejects.toThrow(ValidationError);
      });
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token successfully', () => {
      const mockDecoded = {
        userId: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        iat: 1234567890,
        exp: 1234567890,
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      const result = authService.verifyToken('valid-token');

      expect(jwt.verify).toHaveBeenCalled();
      expect(result).toEqual(mockDecoded);
    });

    it('should throw ValidationError for invalid token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => authService.verifyToken('invalid-token')).toThrow(ValidationError);
    });

    it('should throw ValidationError for expired token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        const error: any = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      expect(() => authService.verifyToken('expired-token')).toThrow(ValidationError);
    });
  });

  describe('generateToken', () => {
    it('should generate token with correct payload', () => {
      const mockUser: any = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      };

      (jwt.sign as jest.Mock).mockReturnValue('generated-token');

      const result = authService.generateToken(mockUser);

      expect(jwt.sign).toHaveBeenCalled();
      expect(result).toBe('generated-token');
    });
  });
});
