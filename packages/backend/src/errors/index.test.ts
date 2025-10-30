import {
  BaseError,
  NotFoundError,
  ValidationError,
  DatabaseConnectionError,
  TodoLockError,
} from './index';

describe('Error Classes', () => {
  describe('NotFoundError', () => {
    it('should create error with default message', () => {
      const error = new NotFoundError();

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.name).toBe('NotFoundError');
      expect(error.message).toBe('Not found');
    });

    it('should create error with custom message', () => {
      const customMessage = 'Todo with id 123 not found';
      const error = new NotFoundError(customMessage);

      expect(error.name).toBe('NotFoundError');
      expect(error.message).toBe(customMessage);
    });

    it('should have proper stack trace', () => {
      const error = new NotFoundError();

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('NotFoundError');
    });

    it('should be catchable as Error', () => {
      try {
        throw new NotFoundError('Test error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(NotFoundError);
        expect((error as NotFoundError).message).toBe('Test error');
      }
    });

    it('should maintain error properties after serialization', () => {
      const error = new NotFoundError('Serialization test');
      const serialized = JSON.stringify(error, Object.getOwnPropertyNames(error));
      const parsed = JSON.parse(serialized);

      expect(parsed.name).toBe('NotFoundError');
      expect(parsed.message).toBe('Serialization test');
    });

    it('should have correct status code', () => {
      const error = new NotFoundError();
      expect(error.statusCode).toBe(404);
    });

    it('should serialize errors correctly', () => {
      const error = new NotFoundError('Test not found');
      const serialized = error.serializeErrors();

      expect(serialized).toEqual([{ message: 'Test not found' }]);
    });
  });

  describe('ValidationError', () => {
    it('should create error with default message', () => {
      const error = new ValidationError([]);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Validation failed');
    });

    it('should create error with validation errors', () => {
      const validationErrors = [
        { message: 'Title is required', field: 'title' },
        { message: 'Description too long', field: 'description' },
      ];
      const error = new ValidationError(validationErrors);

      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Validation failed');
    });

    it('should have proper stack trace', () => {
      const error = new ValidationError([]);

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ValidationError');
    });

    it('should be distinguishable from other error types', () => {
      const validationError = new ValidationError([]);
      const notFoundError = new NotFoundError('Not found');

      expect(validationError).toBeInstanceOf(ValidationError);
      expect(validationError).not.toBeInstanceOf(NotFoundError);
      expect(notFoundError).toBeInstanceOf(NotFoundError);
      expect(notFoundError).not.toBeInstanceOf(ValidationError);
    });

    it('should have correct status code', () => {
      const error = new ValidationError([]);
      expect(error.statusCode).toBe(400);
    });

    it('should serialize errors correctly', () => {
      const validationErrors = [
        { message: 'Title is required', field: 'title' },
        { message: 'Description too long', field: 'description' },
      ];
      const error = new ValidationError(validationErrors);
      const serialized = error.serializeErrors();

      expect(serialized).toEqual(validationErrors);
    });
  });

  describe('DatabaseConnectionError', () => {
    it('should create error with default message', () => {
      const error = new DatabaseConnectionError();

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DatabaseConnectionError);
      expect(error.name).toBe('DatabaseConnectionError');
      expect(error.message).toBe('Database connection error');
    });

    it('should create error with custom message', () => {
      const customMessage = 'Failed to connect to MongoDB: connection timeout';
      const error = new DatabaseConnectionError(customMessage);

      expect(error.name).toBe('DatabaseConnectionError');
      expect(error.message).toBe(customMessage);
    });

    it('should handle connection timeout scenarios', () => {
      const timeoutMessage = 'Connection timeout after 5000ms';
      const error = new DatabaseConnectionError(timeoutMessage);

      expect(error.message).toBe(timeoutMessage);
      expect(error.name).toBe('DatabaseConnectionError');
    });

    it('should handle authentication errors', () => {
      const authMessage = 'Authentication failed for user: testuser';
      const error = new DatabaseConnectionError(authMessage);

      expect(error.message).toBe(authMessage);
    });

    it('should have proper stack trace', () => {
      const error = new DatabaseConnectionError();

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('DatabaseConnectionError');
    });

    it('should have correct status code', () => {
      const error = new DatabaseConnectionError();
      expect(error.statusCode).toBe(500);
    });

    it('should serialize errors correctly', () => {
      const error = new DatabaseConnectionError('Connection failed');
      const serialized = error.serializeErrors();

      expect(serialized).toEqual([{ message: 'Connection failed' }]);
    });
  });

  describe('TodoLockError', () => {
    it('should create error with default message', () => {
      const error = new TodoLockError();

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(TodoLockError);
      expect(error.name).toBe('TodoLockError');
      expect(error.message).toBe('Todo is locked and cannot be modified');
    });

    it('should create error with custom message', () => {
      const customMessage = 'Todo with id 456 is currently locked by another operation';
      const error = new TodoLockError(customMessage);

      expect(error.name).toBe('TodoLockError');
      expect(error.message).toBe(customMessage);
    });

    it('should handle concurrent modification scenarios', () => {
      const concurrencyMessage = 'Concurrent modification detected - todo locked';
      const error = new TodoLockError(concurrencyMessage);

      expect(error.message).toBe(concurrencyMessage);
    });

    it('should have proper stack trace', () => {
      const error = new TodoLockError();

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('TodoLockError');
    });

    it('should be distinguishable from validation errors', () => {
      const lockError = new TodoLockError('Todo is locked');
      const validationError = new ValidationError([]);

      expect(lockError).toBeInstanceOf(TodoLockError);
      expect(lockError).not.toBeInstanceOf(ValidationError);
      expect(validationError).toBeInstanceOf(ValidationError);
      expect(validationError).not.toBeInstanceOf(TodoLockError);
    });

    it('should have correct status code', () => {
      const error = new TodoLockError();
      expect(error.statusCode).toBe(409);
    });

    it('should serialize errors correctly', () => {
      const error = new TodoLockError('Todo locked');
      const serialized = error.serializeErrors();

      expect(serialized).toEqual([{ message: 'Todo locked' }]);
    });
  });

  describe('Error Inheritance Chain', () => {
    it('should all inherit from Error', () => {
      const notFound = new NotFoundError();
      const validation = new ValidationError([]);
      const dbConnection = new DatabaseConnectionError();
      const todoLock = new TodoLockError();

      expect(notFound).toBeInstanceOf(Error);
      expect(validation).toBeInstanceOf(Error);
      expect(dbConnection).toBeInstanceOf(Error);
      expect(todoLock).toBeInstanceOf(Error);
    });

    it('should have unique constructor names', () => {
      expect(NotFoundError.name).toBe('NotFoundError');
      expect(ValidationError.name).toBe('ValidationError');
      expect(DatabaseConnectionError.name).toBe('DatabaseConnectionError');
      expect(TodoLockError.name).toBe('TodoLockError');
    });

    it('should be catchable in generic error handlers', () => {
      const errors = [
        new NotFoundError('Not found'),
        new ValidationError([{ message: 'Invalid' }]),
        new DatabaseConnectionError('Connection failed'),
        new TodoLockError('Locked'),
      ];

      errors.forEach((error) => {
        try {
          throw error;
        } catch (caught) {
          expect(caught).toBeInstanceOf(Error);
          expect((caught as Error).message).toBeDefined();
          expect((caught as Error).name).toBeDefined();
        }
      });
    });
  });

  describe('Error Usage Patterns', () => {
    it('should support instanceof checks for error handling', () => {
      const handleError = (error: Error) => {
        if (error instanceof NotFoundError) {
          return 'not_found';
        } else if (error instanceof ValidationError) {
          return 'validation';
        } else if (error instanceof DatabaseConnectionError) {
          return 'database';
        } else if (error instanceof TodoLockError) {
          return 'lock';
        }
        return 'unknown';
      };

      expect(handleError(new NotFoundError())).toBe('not_found');
      expect(handleError(new ValidationError([]))).toBe('validation');
      expect(handleError(new DatabaseConnectionError())).toBe('database');
      expect(handleError(new TodoLockError())).toBe('lock');
      expect(handleError(new Error('Generic error'))).toBe('unknown');
    });

    it('should preserve error context in async operations', async () => {
      const asyncOperation = async (): Promise<never> => {
        throw new NotFoundError('Async error');
      };

      try {
        await asyncOperation();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
        expect((error as NotFoundError).message).toBe('Async error');
      }
    });

    it('should work with Promise.catch', async () => {
      const promise = Promise.reject(new ValidationError([{ message: 'Promise error' }]));

      await promise.catch((error) => {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toBe('Validation failed');
      });
    });
  });
});