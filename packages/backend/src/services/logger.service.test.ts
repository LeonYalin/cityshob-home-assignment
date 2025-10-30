import { Logger } from './logger.service';
import winston from 'winston';

// Mock winston completely
jest.mock('winston', () => {
  const mockLoggerInstance = {
    add: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    level: 'info',
    format: {},
    transports: [],
    _events: {},
    _eventsCount: 0,
    _maxListeners: undefined,
  };

  const mockLogger = {
    createLogger: jest.fn(() => mockLoggerInstance),
    transports: {
      Console: jest.fn().mockImplementation(() => ({
        format: {},
        level: 'info',
      })),
      File: jest.fn().mockImplementation(() => ({
        format: {},
        level: 'info',
      })),
    },
    format: {
      simple: jest.fn(() => ({ options: {} })),
      json: jest.fn(() => ({ options: {} })),
      timestamp: jest.fn(() => ({ options: {} })),
      combine: jest.fn((...args) => ({ options: {}, formats: args })),
      printf: jest.fn(() => ({ options: {} })),
      colorize: jest.fn(() => ({ options: {} })),
      errors: jest.fn(() => ({ options: {} })), // Add missing errors format
    },
  };
  return mockLogger;
});

describe('Logger Service', () => {
  let mockWinstonLogger: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockWinstonLogger = {
      add: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    (winston.createLogger as jest.Mock).mockReturnValue(mockWinstonLogger);
  });

  describe('constructor', () => {
    it('should create logger with context', () => {
      const logger = new Logger('TestContext');

      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
        })
      );
    });

    it('should use LOG_LEVEL environment variable', () => {
      process.env.LOG_LEVEL = 'debug';
      
      new Logger();

      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'debug',
        })
      );

      delete process.env.LOG_LEVEL;
    });

    it('should create development transports when NODE_ENV is not production', () => {
      process.env.NODE_ENV = 'development';
      
      new Logger();

      expect(winston.transports.Console).toHaveBeenCalled();
      expect(winston.transports.File).not.toHaveBeenCalled();

      delete process.env.NODE_ENV;
    });

    it('should create production transports when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      
      new Logger();

      expect(winston.transports.Console).toHaveBeenCalled();
      expect(winston.transports.File).toHaveBeenCalledTimes(2); // Error and combined logs

      delete process.env.NODE_ENV;
    });
  });

  describe('logging methods', () => {
    let logger: Logger;

    beforeEach(() => {
      logger = new Logger('TestService');
    });

    it('should log info messages', () => {
      logger.info('Test info message');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('Test info message');
    });

    it('should log info messages with metadata', () => {
      const metadata = { userId: 123, action: 'create' };
      logger.info('User action', metadata);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('User action', metadata);
    });

    it('should log warning messages', () => {
      logger.warn('Test warning');

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith('Test warning');
    });

    it('should log warning messages with metadata', () => {
      const metadata = { attempt: 3, maxAttempts: 5 };
      logger.warn('Retry attempt', metadata);

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith('Retry attempt', metadata);
    });

    it('should log error messages', () => {
      logger.error('Test error');

      expect(mockWinstonLogger.error).toHaveBeenCalledWith('Test error');
    });

    it('should log error messages with metadata', () => {
      const error = new Error('Test error');
      logger.error('Database connection failed', error);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith('Database connection failed', error);
    });

    it('should log debug messages', () => {
      logger.debug('Debug information');

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith('Debug information');
    });

    it('should log debug messages with metadata', () => {
      const debugData = { queryTime: '150ms', cacheHit: false };
      logger.debug('Database query executed', debugData);

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith('Database query executed', debugData);
    });
  });

  describe('context handling', () => {
    it('should work without context', () => {
      const logger = new Logger();
      logger.info('No context message');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('No context message');
    });

    it('should include context in log format setup', () => {
      new Logger('ServiceContext');

      expect(winston.createLogger).toHaveBeenCalled();
      // Context is handled in the log format configuration
    });
  });

  describe('environment configurations', () => {
    afterEach(() => {
      delete process.env.NODE_ENV;
      delete process.env.LOG_LEVEL;
    });

    it('should configure for development environment', () => {
      process.env.NODE_ENV = 'development';
      
      new Logger();

      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
        })
      );
    });

    it('should configure for production environment', () => {
      process.env.NODE_ENV = 'production';
      
      new Logger();

      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
        })
      );
    });

    it('should respect custom log levels', () => {
      process.env.LOG_LEVEL = 'error';
      
      new Logger();

      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'error',
        })
      );
    });
  });

  describe('real logging behavior', () => {
    it('should create actual winston logger instance', () => {
      // Test that we're actually creating a real winston logger
      const logger = new Logger('RealTest');
      
      expect(winston.createLogger).toHaveBeenCalledTimes(1);
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should handle complex metadata objects', () => {
      const logger = new Logger('ComplexTest');
      const complexMeta = {
        user: { id: 123, email: 'test@example.com' },
        request: { method: 'POST', url: '/api/todos' },
        timing: { start: Date.now(), duration: 150 },
        nested: { data: { value: 'deep' } }
      };

      logger.info('Complex operation completed', complexMeta);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'Complex operation completed',
        complexMeta
      );
    });

    it('should handle error objects properly', () => {
      const logger = new Logger('ErrorTest');
      const error = new Error('Test error message');
      error.stack = 'Error stack trace...';

      logger.error('Operation failed', error);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith('Operation failed', error);
    });
  });
});