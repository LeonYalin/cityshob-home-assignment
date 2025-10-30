import { 
  CreateTodoInput, 
  UpdateTodoInput, 
  TodoQueryParams,
  CreateTodoSchema,
  UpdateTodoSchema,
  TodoQuerySchema
} from './todo.schema';
import { ValidationError } from '../errors';

// Simple validation helper
function validateInput<T>(schema: any, input: any): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const errors = result.error.issues.map((issue: any) => ({
      message: issue.message,
      field: issue.path.join('.'),
    }));
    throw new ValidationError(errors);
  }
  return result.data;
}

describe('Request Validation Unit Tests', () => {
  describe('CreateTodoInput validation', () => {
    it('should validate correct todo input', () => {
      const validInput = {
        title: 'Test Todo',
        description: 'Test description',
        priority: 'high' as const,
      };

      const result = CreateTodoSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Test Todo');
        expect(result.data.description).toBe('Test description');
        expect(result.data.priority).toBe('high');
      }
    });

    it('should validate minimal todo input', () => {
      const minimalInput = {
        title: 'Test Todo',
      };

      const result = CreateTodoSchema.safeParse(minimalInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Test Todo');
        expect(result.data.description).toBe(''); // Default value
        expect(result.data.priority).toBe('medium'); // Default value
      }
    });

    it('should reject input without title', () => {
      const invalidInput = {
        description: 'Test description',
      };

      const result = CreateTodoSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['title'],
              message: 'Invalid input: expected string, received undefined',
            }),
          ])
        );
      }
    });

    it('should reject empty title', () => {
      const invalidInput = {
        title: '',
      };

      const result = CreateTodoSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['title'],
              message: 'Title is required',
            }),
          ])
        );
      }
    });

    it('should reject title longer than 200 characters', () => {
      const invalidInput = {
        title: 'a'.repeat(201),
      };

      const result = CreateTodoSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['title'],
              message: 'Title must be less than 200 characters',
            }),
          ])
        );
      }
    });

    it('should reject invalid priority', () => {
      const invalidInput = {
        title: 'Test Todo',
        priority: 'invalid-priority',
      };

      const result = CreateTodoSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['priority'],
              message: 'Invalid option: expected one of "low"|"medium"|"high"',
            }),
          ])
        );
      }
    });

    it('should accept valid priority values', () => {
      const priorities = ['low', 'medium', 'high'] as const;

      priorities.forEach(priority => {
        const input = {
          title: 'Test Todo',
          priority,
        };

        const result = CreateTodoSchema.safeParse(input);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.priority).toBe(priority);
        }
      });
    });

    it('should trim title and description', () => {
      const input = {
        title: '  Test Todo  ',
        description: '  Test description  ',
      };

      const result = CreateTodoSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Test Todo');
        expect(result.data.description).toBe('Test description');
      }
    });

    it('should reject description longer than 1000 characters', () => {
      const invalidInput = {
        title: 'Test Todo',
        description: 'a'.repeat(1001),
      };

      const result = CreateTodoSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['description'],
              message: 'Description must be less than 1000 characters',
            }),
          ])
        );
      }
    });
  });

  describe('UpdateTodoInput validation', () => {
    it('should validate partial update input', () => {
      const validInput = {
        title: 'Updated Todo',
      };

      const result = UpdateTodoSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validInput);
      }
    });

    it('should validate complete update input', () => {
      const validInput = {
        title: 'Updated Todo',
        description: 'Updated description',
        priority: 'medium' as const,
        completed: true,
      };

      const result = UpdateTodoSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validInput);
      }
    });

    it('should allow empty update input', () => {
      const emptyInput = {};

      const result = UpdateTodoSchema.safeParse(emptyInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({});
      }
    });

    it('should reject empty title in update', () => {
      const invalidInput = {
        title: '',
      };

      const result = UpdateTodoSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['title'],
              message: 'Title is required',
            }),
          ])
        );
      }
    });

    it('should validate completed field as boolean', () => {
      const validInput = {
        completed: false,
      };

      const result = UpdateTodoSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.completed).toBe(false);
      }
    });

    it('should reject non-boolean completed field', () => {
      const invalidInput = {
        completed: 'true',
      };

      const result = UpdateTodoSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['completed'],
              message: 'Invalid input: expected boolean, received string',
            }),
          ])
        );
      }
    });

    it('should trim updated title and description', () => {
      const input = {
        title: '  Updated Todo  ',
        description: '  Updated description  ',
      };

      const result = UpdateTodoSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Updated Todo');
        expect(result.data.description).toBe('Updated description');
      }
    });
  });

  describe('TodoQueryParams validation', () => {
    it('should validate empty query', () => {
      const emptyQuery = {};

      const result = TodoQuerySchema.safeParse(emptyQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10); // Default value
        expect(result.data.page).toBe(1); // Default value
      }
    });

    it('should validate complete query', () => {
      const validQuery = {
        completed: 'true',
        priority: 'high' as const,
        page: '2',
        limit: '20',
      };

      const result = TodoQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.completed).toBe(true);
        expect(result.data.priority).toBe('high');
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should convert string numbers to numbers', () => {
      const queryWithStrings = {
        page: '3',
        limit: '15',
      };

      const result = TodoQuerySchema.safeParse(queryWithStrings);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(15);
      }
    });

    it('should convert string boolean to boolean', () => {
      const queryWithString = {
        completed: 'true',
      };

      const result = TodoQuerySchema.safeParse(queryWithString);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.completed).toBe(true);
      }
    });

    it('should handle false boolean conversion', () => {
      const queryWithString = {
        completed: 'false',
      };

      const result = TodoQuerySchema.safeParse(queryWithString);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.completed).toBe(false);
      }
    });

    it('should reject invalid priority in query', () => {
      const invalidQuery = {
        priority: 'invalid-priority',
      };

      const result = TodoQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['priority'],
              message: 'Invalid option: expected one of "low"|"medium"|"high"',
            }),
          ])
        );
      }
    });

    it('should reject negative page number', () => {
      const invalidQuery = {
        page: '-1',
      };

      const result = TodoQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['page'],
              message: 'Page must be at least 1',
            }),
          ])
        );
      }
    });

    it('should reject limit over 100', () => {
      const invalidQuery = {
        limit: '101',
      };

      const result = TodoQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['limit'],
              message: 'Limit must be at most 100',
            }),
          ])
        );
      }
    });

    it('should reject zero limit', () => {
      const invalidQuery = {
        limit: '0',
      };

      const result = TodoQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['limit'],
              message: 'Limit must be at least 1',
            }),
          ])
        );
      }
    });

    it('should reject zero page', () => {
      const invalidQuery = {
        page: '0',
      };

      const result = TodoQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['page'],
              message: 'Page must be at least 1',
            }),
          ])
        );
      }
    });

    it('should handle numeric inputs directly', () => {
      const numericQuery = {
        page: 5,
        limit: 25,
      };

      const result = TodoQuerySchema.safeParse(numericQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(5);
        expect(result.data.limit).toBe(25);
      }
    });
  });

  describe('validateInput utility function', () => {
    it('should return data for valid input', () => {
      const validInput = {
        title: 'Test Todo',
      };

      const result = validateInput<CreateTodoInput>(CreateTodoSchema, validInput);
      expect(result.title).toBe('Test Todo');
      expect(result.description).toBe(''); // Default
      expect(result.priority).toBe('medium'); // Default
    });

    it('should throw ValidationError for invalid input', () => {
      const invalidInput = {
        title: '',
      };

      expect(() => validateInput(CreateTodoSchema, invalidInput))
        .toThrow(ValidationError);
    });

    it('should include field errors in ValidationError', () => {
      const invalidInput = {
        title: '',
        priority: 'invalid',
      };

      try {
        validateInput(CreateTodoSchema, invalidInput);
        fail('Expected ValidationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.message).toContain('Validation failed');
        expect(validationError.errors).toBeDefined();
        expect(validationError.errors.length).toBeGreaterThan(0);
        
        const errorFields = validationError.errors.map(e => e.field);
        expect(errorFields).toContain('title');
        expect(errorFields).toContain('priority');
      }
    });
  });

  describe('edge cases and boundary conditions', () => {
    it('should handle exact boundary values', () => {
      const boundaryInput = {
        title: 'a'.repeat(200), // Exactly at max length
        description: 'b'.repeat(1000), // Exactly at max length
      };

      const result = CreateTodoSchema.safeParse(boundaryInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('a'.repeat(200));
        expect(result.data.description).toBe('b'.repeat(1000));
      }
    });

    it('should handle minimum valid page and limit', () => {
      const minQuery = {
        page: '1',
        limit: '1',
      };

      const result = TodoQuerySchema.safeParse(minQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(1);
      }
    });

    it('should handle maximum valid limit', () => {
      const maxQuery = {
        limit: '100',
      };

      const result = TodoQuerySchema.safeParse(maxQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(100);
      }
    });

    it('should handle undefined vs null values', () => {
      const inputWithNull = {
        title: 'Test Todo',
        description: null,
      };

      const result = CreateTodoSchema.safeParse(inputWithNull);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['description'],
              message: 'Invalid input: expected string, received null',
            }),
          ])
        );
      }
    });

    it('should handle malformed completed values', () => {
      const testCases = [
        { input: 'maybe', expected: false },
        { input: 'yes', expected: false },
        { input: 'no', expected: false },
        { input: '', expected: false },
      ];

      testCases.forEach(({ input, expected }) => {
        const query = { completed: input };
        const result = TodoQuerySchema.safeParse(query);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.completed).toBe(expected);
        }
      });
    });

    it('should handle invalid number coercion', () => {
      const invalidQuery = {
        page: 'not-a-number',
      };

      const result = TodoQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['page'],
              message: 'Invalid input: expected number, received NaN',
            }),
          ])
        );
      }
    });
  });
});