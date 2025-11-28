import { InMemoryTodoRepository } from './in-memory-todo.repository';
import { CreateTodoInput, UpdateTodoInput } from '../schemas/todo.schema';
import { Logger } from '../services/logger.service';
import { NotFoundError } from '../errors';

describe('InMemoryTodoRepository', () => {
  let repository: InMemoryTodoRepository;
  let mockLogger: Logger;

  // Helper function to create a valid CreateTodoInput with default values
  const createValidInput = (overrides: Partial<CreateTodoInput & { createdBy: string }> = {}): CreateTodoInput & { createdBy: string } => ({
    title: 'Test Todo',
    description: '',
    priority: 'medium',
    createdBy: 'test-user-123',
    ...overrides
  });

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;
    repository = new InMemoryTodoRepository(mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('should create a todo with all fields', async () => {
      const input = createValidInput({
        title: 'Test Todo',
        description: 'Test description',
        priority: 'high'
      });

      const todo = await repository.create(input);

      expect(todo).toMatchObject({
        id: expect.any(String),
        title: 'Test Todo',
        description: 'Test description',
        priority: 'high',
        completed: false,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });

    test('should create a todo with minimal fields', async () => {
      const input = createValidInput({ title: 'Simple Todo' });

      const todo = await repository.create(input);

      expect(todo).toMatchObject({
        id: expect.any(String),
        title: 'Simple Todo',
        description: '',
        priority: 'medium',
        completed: false,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });

    test('should generate unique IDs for multiple todos', async () => {
      const input1 = createValidInput({ title: 'Todo 1' });
      const input2 = createValidInput({ title: 'Todo 2' });

      const todo1 = await repository.create(input1);
      const todo2 = await repository.create(input2);

      expect(todo1.id).not.toBe(todo2.id);
      expect(todo1.title).toBe('Todo 1');
      expect(todo2.title).toBe('Todo 2');
    });
  });

  describe('findById', () => {
    test('should find a todo by ID', async () => {
      const input = createValidInput({ title: 'Find Me' });
      const created = await repository.create(input);

      const found = await repository.findById(created.id);

      expect(found).toMatchObject({
        id: created.id,
        title: 'Find Me',
        completed: false,
        priority: 'medium',
        createdBy: 'test-user-123'
      });
    });

    test('should return null for non-existent ID', async () => {
      const found = await repository.findById('non-existent-id');

      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    test('should return empty array when no todos exist', async () => {
      const todos = await repository.findAll();

      expect(todos).toEqual([]);
    });

    test('should return all todos when no filter provided', async () => {
      const input1 = createValidInput({ title: 'Todo 1' });
      await repository.create(input1);
      
      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 5));
      const input2 = createValidInput({ title: 'Todo 2' });
      await repository.create(input2);
      
      await new Promise(resolve => setTimeout(resolve, 5));
      const input3 = createValidInput({ title: 'Todo 3' });
      await repository.create(input3);

      const todos = await repository.findAll();

      expect(todos).toHaveLength(3);
      expect(todos.map(t => t.title)).toEqual(['Todo 3', 'Todo 2', 'Todo 1']); // Most recent first
    });

    test('should filter by completed status', async () => {
      const input1 = createValidInput({ title: 'Todo 1' });
      const input2 = createValidInput({ title: 'Todo 2' });
      const input3 = createValidInput({ title: 'Todo 3' });

      const todo1 = await repository.create(input1);
      await repository.create(input2);
      await repository.create(input3);

      // Complete one todo
      await repository.update(todo1.id, { completed: true });

      const completedTodos = await repository.findAll({ completed: true, limit: 10, page: 1 });
      const incompleteTodos = await repository.findAll({ completed: false, limit: 10, page: 1 });

      expect(completedTodos).toHaveLength(1);
      expect(completedTodos[0].title).toBe('Todo 1');
      expect(incompleteTodos).toHaveLength(2);
    });

    test('should filter by priority', async () => {
      await repository.create(createValidInput({ title: 'High 1', priority: 'high' }));
      await repository.create(createValidInput({ title: 'Medium 1', priority: 'medium' }));
      await repository.create(createValidInput({ title: 'High 2', priority: 'high' }));
      await repository.create(createValidInput({ title: 'Low 1', priority: 'low' }));

      const highPriority = await repository.findAll({ priority: 'high', limit: 10, page: 1 });
      const mediumPriority = await repository.findAll({ priority: 'medium', limit: 10, page: 1 });
      const lowPriority = await repository.findAll({ priority: 'low', limit: 10, page: 1 });

      expect(highPriority).toHaveLength(2);
      expect(mediumPriority).toHaveLength(1);
      expect(lowPriority).toHaveLength(1);
    });

    test('should support pagination', async () => {
      await repository.create(createValidInput({ title: 'Todo 1' }));
      await new Promise(resolve => setTimeout(resolve, 5));
      await repository.create(createValidInput({ title: 'Todo 2' }));
      await new Promise(resolve => setTimeout(resolve, 5));
      await repository.create(createValidInput({ title: 'Todo 3' }));

      const page1 = await repository.findAll({ page: 1, limit: 2 });
      const page2 = await repository.findAll({ page: 2, limit: 2 });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(1);
      // Most recent first (Todo 3, Todo 2)
      expect(page1[0].title).toBe('Todo 3');
      expect(page1[1].title).toBe('Todo 2');
      expect(page2[0].title).toBe('Todo 1');
    });
  });

  describe('update', () => {
    test('should update a todo', async () => {
      const input = createValidInput({ title: 'Original Title' });
      const created = await repository.create(input);

      // Add delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      const updateData: UpdateTodoInput = {
        title: 'Updated Title',
        description: 'Updated description',
        priority: 'high'
      };

      const updated = await repository.update(created.id, updateData);

      expect(updated).toMatchObject({
        id: created.id,
        title: 'Updated Title',
        description: 'Updated description',
        priority: 'high',
        completed: false,
        createdAt: created.createdAt,
        updatedAt: expect.any(Date)
      });
      expect(updated!.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
    });

    test('should return null for non-existent todo', async () => {
      const updateData: UpdateTodoInput = { title: 'Updated' };

      const result = await repository.update('non-existent-id', updateData);

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    test('should delete a todo', async () => {
      const input = createValidInput({ title: 'Todo to Delete' });
      const created = await repository.create(input);

      const result = await repository.delete(created.id);

      expect(result).toBe(true);
      
      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });

    test('should return false for non-existent todo', async () => {
      const result = await repository.delete('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    test('should handle large page numbers gracefully', async () => {
      await repository.create(createValidInput({ title: 'Todo 1' }));
      await repository.create(createValidInput({ title: 'Todo 2' }));

      const todos = await repository.findAll({ page: 999, limit: 10 });

      expect(todos).toHaveLength(0);
    });

    test('should respect limit parameter', async () => {
      await repository.create(createValidInput({ title: 'Todo 1' }));
      await repository.create(createValidInput({ title: 'Todo 2' }));
      await repository.create(createValidInput({ title: 'Todo 3' }));

      const todos = await repository.findAll({ page: 1, limit: 2 });

      expect(todos).toHaveLength(2);
    });
  });
});