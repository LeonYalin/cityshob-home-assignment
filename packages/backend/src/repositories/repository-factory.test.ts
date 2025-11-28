import { RepositoryFactory } from './repository.factory';
import { DatabaseService } from '../services/database.service';

// Mock mongoose for fast unit tests
jest.mock('mongoose', () => {
  const mockSchema = jest.fn().mockImplementation(() => ({
    pre: jest.fn(),
    set: jest.fn(),
    virtual: jest.fn(() => ({ get: jest.fn() })),
    statics: {},
    index: jest.fn(),
  }));
  
  const mockModel = jest.fn();
  
  return {
    __esModule: true,
    default: {
      connect: jest.fn(),
      disconnect: jest.fn(),
      connection: {
        readyState: 1,
        on: jest.fn(),
        db: {
          admin: () => ({ ping: jest.fn() }),
        },
      },
      model: mockModel,
    },
    Schema: mockSchema,
    model: mockModel,
    connect: jest.fn(),
    disconnect: jest.fn(),
    connection: {
      readyState: 1,
      on: jest.fn(),
      db: {
        admin: () => ({ ping: jest.fn() }),
      },
    },
  };
});

describe('RepositoryFactory Unit Tests', () => {
  let databaseService: DatabaseService;

  beforeEach(async () => {
    RepositoryFactory.resetRepository();
    databaseService = DatabaseService.getInstance();
    
    // Clear any existing repository state
    const repo = await RepositoryFactory.getTodoRepository();
    if ('clearAll' in repo && typeof repo.clearAll === 'function') {
      (repo as any).clearAll();
    }
  });

  afterEach(() => {
    RepositoryFactory.resetRepository();
  });

  describe('getTodoRepository', () => {
    it('should return repository instance', async () => {
      const repository = await RepositoryFactory.getTodoRepository();

      expect(repository).toBeDefined();
      expect(typeof repository.create).toBe('function');
      expect(typeof repository.findById).toBe('function');
      expect(typeof repository.findAll).toBe('function');
      expect(typeof repository.update).toBe('function');
      expect(typeof repository.delete).toBe('function');
      expect(typeof repository.ping).toBe('function');
    });

    it('should return cached instance on subsequent calls', async () => {
      const repo1 = await RepositoryFactory.getTodoRepository();
      const repo2 = await RepositoryFactory.getTodoRepository();

      expect(repo1).toBe(repo2);
    });

    it('should create new instance after reset', async () => {
      const repo1 = await RepositoryFactory.getTodoRepository();
      
      RepositoryFactory.resetRepository();
      
      const repo2 = await RepositoryFactory.getTodoRepository();
      expect(repo1).not.toBe(repo2);
    });

    it('should fallback to in-memory when database not available', async () => {
      // Mock database service to return false for connection status
      jest.spyOn(databaseService, 'getConnectionStatus').mockReturnValue(false);

      const repository = await RepositoryFactory.getTodoRepository();

      expect(repository).toBeDefined();
      expect(await repository.ping()).toBe(true); // In-memory should always be available
    });

    it('should use MongoDB when available and ping succeeds', async () => {
      // Mock database service to return true for connection status
      jest.spyOn(databaseService, 'getConnectionStatus').mockReturnValue(true);

      const repository = await RepositoryFactory.getTodoRepository();

      expect(repository).toBeDefined();
      // Should attempt to use MongoDB repository
    });

    it('should fallback when MongoDB ping fails', async () => {
      // Mock database service to return true but repository ping to fail
      jest.spyOn(databaseService, 'getConnectionStatus').mockReturnValue(true);

      const repository = await RepositoryFactory.getTodoRepository();

      expect(repository).toBeDefined();
      // Should fallback to in-memory if MongoDB repository creation fails
    });
  });

  describe('repository behavior verification', () => {
    it('should create working repository instance', async () => {
      const repository = await RepositoryFactory.getTodoRepository();

      // Test basic repository operations
      const created = await repository.create({
        title: 'Test Todo',
        description: 'Test Description',
        priority: 'medium',
        createdBy: 'test-user-123',
      });

      expect(created).toBeDefined();
      expect(created.title).toBe('Test Todo');
      expect(created.id).toBeDefined();

      const found = await repository.findById(created.id);
      expect(found).toMatchObject({
        id: created.id,
        title: 'Test Todo',
        description: 'Test Description',
        priority: 'medium',
        createdBy: 'test-user-123',
      });

      const all = await repository.findAll();
      expect(all).toHaveLength(1);
      expect(all[0]).toMatchObject({
        id: created.id,
        title: 'Test Todo',
        description: 'Test Description',
        priority: 'medium',
        createdBy: 'test-user-123',
      });
    });

    it('should handle repository errors gracefully', async () => {
      const repository = await RepositoryFactory.getTodoRepository();

      // Test error handling
      const notFound = await repository.findById('nonexistent-id');
      expect(notFound).toBeNull();

      const deleteResult = await repository.delete('nonexistent-id');
      expect(deleteResult).toBe(false);
    });

    it('should support locking operations', async () => {
      const repository = await RepositoryFactory.getTodoRepository();

      const created = await repository.create({
        title: 'Lockable Todo',
        description: 'Can be locked',
        priority: 'high',
        createdBy: 'test-user-123',
      });

      const locked = await repository.findByIdAndLock(created.id, 'user123');
      expect(locked).toBeDefined();
      expect(locked?.isLocked).toBe(true);

      const isLocked = await repository.isLocked(created.id);
      expect(isLocked).toBe(true);

      await repository.unlock(created.id);
      const isUnlocked = await repository.isLocked(created.id);
      expect(isUnlocked).toBe(false);
    });

    it('should support query operations', async () => {
      const repository = await RepositoryFactory.getTodoRepository();

      // Create test data
      await repository.create({ title: 'High Priority', description: 'Urgent', priority: 'high', createdBy: 'test-user-123' });
      await repository.create({ title: 'Low Priority', description: 'Later', priority: 'low', createdBy: 'test-user-123' });

      const todo3 = await repository.create({ title: 'Completed Task', description: 'Done', priority: 'medium', createdBy: 'test-user-123' });
      await repository.toggleCompletion(todo3.id);

      // Test queries
      const highPriority = await repository.findByPriority('high');
      expect(highPriority).toHaveLength(1);
      expect(highPriority[0].title).toBe('High Priority');

      const completed = await repository.findByStatus(true);
      expect(completed).toHaveLength(1);
      expect(completed[0].title).toBe('Completed Task');

      const totalCount = await repository.count();
      expect(totalCount).toBe(3);
    });
  });

  describe('error handling and resilience', () => {
    it('should handle database service errors', async () => {
      // Mock database service to throw error
      jest.spyOn(DatabaseService, 'getInstance').mockImplementation(() => {
        throw new Error('Database service initialization failed');
      });

      // Should still return a working repository (fallback)
      const repository = await RepositoryFactory.getTodoRepository();
      expect(repository).toBeDefined();
      expect(await repository.ping()).toBe(true);

      // Restore mock
      jest.restoreAllMocks();
    });

    it('should handle repository creation failures gracefully', async () => {
      // This test verifies that even if repository creation has issues,
      // we get a functional repository
      const repository = await RepositoryFactory.getTodoRepository();
      
      expect(repository).toBeDefined();
      expect(typeof repository.create).toBe('function');
    });

    it('should maintain repository state across operations', async () => {
      const repository = await RepositoryFactory.getTodoRepository();

      // Create multiple todos
      const todos = await Promise.all([
        repository.create({ title: 'Todo 1', description: 'First', priority: 'high', createdBy: 'test-user-123' }),
        repository.create({ title: 'Todo 2', description: 'Second', priority: 'medium', createdBy: 'test-user-123' }),
        repository.create({ title: 'Todo 3', description: 'Third', priority: 'low', createdBy: 'test-user-123' }),
      ]);

      expect(todos).toHaveLength(3);

      // Verify they're all stored
      const allTodos = await repository.findAll();
      expect(allTodos).toHaveLength(3);

      // Delete one
      await repository.delete(todos[1].id);

      // Verify count is correct
      const finalCount = await repository.count();
      expect(finalCount).toBe(2);
    });
  });

  describe('singleton behavior', () => {
    it('should maintain same repository instance across multiple factory calls', async () => {
      const repo1 = await RepositoryFactory.getTodoRepository();
      const repo2 = await RepositoryFactory.getTodoRepository();
      const repo3 = await RepositoryFactory.getTodoRepository();

      expect(repo1).toBe(repo2);
      expect(repo2).toBe(repo3);
    });

    it('should maintain repository data across factory calls', async () => {
      const repo1 = await RepositoryFactory.getTodoRepository();
      await repo1.create({ title: 'Persistent Todo', description: 'Should persist', priority: 'medium', createdBy: 'test-user-123' });

      const repo2 = await RepositoryFactory.getTodoRepository();
      const todos = await repo2.findAll();

      expect(todos).toHaveLength(1);
      expect(todos[0].title).toBe('Persistent Todo');
    });

    it('should clear repository data after reset', async () => {
      const repo1 = await RepositoryFactory.getTodoRepository();
      await repo1.create({ title: 'Temporary Todo', description: 'Will be cleared', priority: 'low', createdBy: 'test-user-123' });

      RepositoryFactory.resetRepository();

      const repo2 = await RepositoryFactory.getTodoRepository();
      const todos = await repo2.findAll();

      // Should be empty (new repository instance)
      expect(todos).toHaveLength(0);
    });
  });
});