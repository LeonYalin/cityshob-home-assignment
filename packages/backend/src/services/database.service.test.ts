import { DatabaseService } from './database.service';
import mongoose from 'mongoose';
import { DatabaseConnectionError } from '../errors';

// Mock mongoose
jest.mock('mongoose');

// Mock logger
jest.mock('./logger.service', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
}));

describe('DatabaseService', () => {
  let databaseService: DatabaseService;
  let mockLogger: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset singleton instance
    (DatabaseService as any).instance = undefined;
    
    const { Logger } = require('./logger.service');
    mockLogger = new Logger('DatabaseService');
    
    databaseService = DatabaseService.getInstance(mockLogger);
  });

  afterEach(() => {
    // Clean up singleton
    (DatabaseService as any).instance = undefined;
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = DatabaseService.getInstance(mockLogger);
      const instance2 = DatabaseService.getInstance(mockLogger);

      expect(instance1).toBe(instance2);
    });

    it('should create instance with logger', () => {
      const instance = DatabaseService.getInstance(mockLogger);
      expect(instance).toBeInstanceOf(DatabaseService);
    });

    it('should create instance without logger', () => {
      (DatabaseService as any).instance = undefined;
      const instance = DatabaseService.getInstance();
      expect(instance).toBeInstanceOf(DatabaseService);
    });
  });

  describe('connect', () => {
    it('should connect to MongoDB successfully', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      (mongoose.connect as jest.Mock).mockResolvedValue({});
      
      // Mock connection events
      const onMock = jest.fn();
      (mongoose.connection as any).on = onMock;

      await databaseService.connect();

      expect(mongoose.connect).toHaveBeenCalledWith(
        'mongodb://localhost:27017/test',
        expect.objectContaining({
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        })
      );
      expect(mockLogger.info).toHaveBeenCalledWith('Connecting to MongoDB...');
      expect(mockLogger.info).toHaveBeenCalledWith('✅ Successfully connected to MongoDB');
      expect(onMock).toHaveBeenCalledWith('error', expect.any(Function));
      expect(onMock).toHaveBeenCalledWith('disconnected', expect.any(Function));
      
      delete process.env.MONGODB_URI;
    });

    it('should skip connection when already connected', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      (mongoose.connect as jest.Mock).mockResolvedValue({});
      (mongoose.connection as any).on = jest.fn();

      // First connection
      await databaseService.connect();
      
      // Second connection attempt
      await databaseService.connect();

      expect(mongoose.connect).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith('Database already connected');
      
      delete process.env.MONGODB_URI;
    });

    it('should log warning when MONGODB_URI is not set', async () => {
      delete process.env.MONGODB_URI;
      
      await databaseService.connect();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'MONGODB_URI environment variable is not set - running in fallback mode'
      );
      expect(mongoose.connect).not.toHaveBeenCalled();
    });

    it('should log warning on connection failure and continue', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      const connectionError = new Error('Connection failed');
      (mongoose.connect as jest.Mock).mockRejectedValue(connectionError);

      await databaseService.connect();

      expect(mockLogger.warn).toHaveBeenCalledWith('MongoDB connection failed - running in fallback mode:', connectionError);
      
      delete process.env.MONGODB_URI;
    });

    it('should handle connection error events', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      (mongoose.connect as jest.Mock).mockResolvedValue({});
      
      let errorHandler: Function | undefined;
      const onMock = jest.fn((event, handler) => {
        if (event === 'error') {
          errorHandler = handler;
        }
      });
      (mongoose.connection as any).on = onMock;

      await databaseService.connect();

      // Simulate connection error event
      const testError = new Error('Connection lost');
      if (errorHandler) {
        errorHandler(testError);
        expect(mockLogger.error).toHaveBeenCalledWith('MongoDB connection error:', testError);
      }
      
      delete process.env.MONGODB_URI;
    });

    it('should handle disconnection events', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      (mongoose.connect as jest.Mock).mockResolvedValue({});
      
      let disconnectHandler: Function | undefined;
      const onMock = jest.fn((event, handler) => {
        if (event === 'disconnected') {
          disconnectHandler = handler;
        }
      });
      (mongoose.connection as any).on = onMock;

      await databaseService.connect();

      // Simulate disconnection event
      if (disconnectHandler) {
        disconnectHandler();
        expect(mockLogger.warn).toHaveBeenCalledWith('MongoDB disconnected');
      }
      
      delete process.env.MONGODB_URI;
    });
  });

  describe('disconnect', () => {
    it('should disconnect from MongoDB successfully', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      (mongoose.connect as jest.Mock).mockResolvedValue({});
      (mongoose.connection as any).on = jest.fn();
      (mongoose.disconnect as jest.Mock).mockResolvedValue({});

      // Connect first
      await databaseService.connect();

      // Then disconnect
      await databaseService.disconnect();

      expect(mongoose.disconnect).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('✅ Successfully disconnected from MongoDB');
      
      delete process.env.MONGODB_URI;
    });

    it('should skip disconnect when not connected', async () => {
      await databaseService.disconnect();

      expect(mockLogger.info).toHaveBeenCalledWith('Database already disconnected');
      expect(mongoose.disconnect).not.toHaveBeenCalled();
    });

    it('should handle disconnection errors', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      (mongoose.connect as jest.Mock).mockResolvedValue({});
      (mongoose.connection as any).on = jest.fn();
      
      const disconnectError = new Error('Disconnection failed');
      (mongoose.disconnect as jest.Mock).mockRejectedValue(disconnectError);

      await databaseService.connect();

      await expect(databaseService.disconnect()).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalledWith('Error disconnecting from MongoDB:', disconnectError);
      
      delete process.env.MONGODB_URI;
    });
  });

  describe('getConnectionStatus', () => {
    it('should return true when connected', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      (mongoose.connect as jest.Mock).mockResolvedValue({});
      (mongoose.connection as any).on = jest.fn();

      await databaseService.connect();

      expect(databaseService.getConnectionStatus()).toBe(true);
      
      delete process.env.MONGODB_URI;
    });

    it('should return false when not connected', () => {
      expect(databaseService.getConnectionStatus()).toBe(false);
    });

    it('should return false after disconnection', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      (mongoose.connect as jest.Mock).mockResolvedValue({});
      (mongoose.connection as any).on = jest.fn();
      (mongoose.disconnect as jest.Mock).mockResolvedValue({});

      await databaseService.connect();
      expect(databaseService.getConnectionStatus()).toBe(true);

      await databaseService.disconnect();
      expect(databaseService.getConnectionStatus()).toBe(false);
      
      delete process.env.MONGODB_URI;
    });
  });
});
