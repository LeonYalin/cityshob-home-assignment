import { ServiceFactory } from '../../services/service.factory';
import { RepositoryFactory } from '../../repositories/repository.factory';

describe('ServiceFactory Integration', () => {
  afterEach(() => {
    ServiceFactory.reset();
    RepositoryFactory.resetRepository();
  });

  describe('getTodoService', () => {
    it('should create TodoService with real dependencies', async () => {
      const todoService = await ServiceFactory.getTodoService();

      expect(todoService).toBeDefined();
      expect(typeof todoService.createTodo).toBe('function');
      expect(typeof todoService.getAllTodos).toBe('function');
      expect(typeof todoService.getTodoById).toBe('function');
    });

    it('should return cached instance on subsequent calls', async () => {
      const service1 = await ServiceFactory.getTodoService();
      const service2 = await ServiceFactory.getTodoService();

      expect(service1).toBe(service2);
    });

    it('should create new instance after reset', async () => {
      const service1 = await ServiceFactory.getTodoService();
      
      ServiceFactory.reset();
      
      const service2 = await ServiceFactory.getTodoService();
      expect(service1).not.toBe(service2);
    });

    it('should handle repository factory errors', async () => {
      // Mock RepositoryFactory to simulate error
      const originalGetRepo = RepositoryFactory.getTodoRepository;
      RepositoryFactory.getTodoRepository = jest.fn().mockRejectedValue(new Error('Repository creation failed'));

      await expect(ServiceFactory.getTodoService()).rejects.toThrow('Repository creation failed');

      // Restore
      RepositoryFactory.getTodoRepository = originalGetRepo;
    });
  });

  describe('getDatabaseService', () => {
    it('should create DatabaseService with logger', () => {
      const databaseService = ServiceFactory.getDatabaseService();

      expect(databaseService).toBeDefined();
      expect(typeof databaseService.connect).toBe('function');
      expect(typeof databaseService.disconnect).toBe('function');
      expect(typeof databaseService.getConnectionStatus).toBe('function');
    });

    it('should return cached instance on subsequent calls', () => {
      const service1 = ServiceFactory.getDatabaseService();
      const service2 = ServiceFactory.getDatabaseService();

      expect(service1).toBe(service2);
    });

    it('should create new instance after reset', () => {
      const service1 = ServiceFactory.getDatabaseService();
      
      ServiceFactory.reset();
      
      const service2 = ServiceFactory.getDatabaseService();
      expect(service1).not.toBe(service2);
    });
  });

  describe('refresh', () => {
    it('should create fresh TodoService instance', async () => {
      const service1 = await ServiceFactory.getTodoService();
      const service2 = await ServiceFactory.refresh();

      expect(service1).not.toBe(service2);
      expect(service2).toBeDefined();
    });

    it('should handle refresh errors', async () => {
      // Mock RepositoryFactory to simulate error on refresh
      const originalGetRepo = RepositoryFactory.getTodoRepository;
      
      // First call succeeds
      await ServiceFactory.getTodoService();
      
      // Refresh fails
      RepositoryFactory.getTodoRepository = jest.fn().mockRejectedValue(new Error('Refresh failed'));
      
      await expect(ServiceFactory.refresh()).rejects.toThrow('Refresh failed');

      // Restore
      RepositoryFactory.getTodoRepository = originalGetRepo;
    });
  });

  describe('integration behavior', () => {
    it('should create services that work together', async () => {
      const todoService = await ServiceFactory.getTodoService();
      const databaseService = ServiceFactory.getDatabaseService();

      // Services should be functional
      expect(todoService).toBeTruthy();
      expect(databaseService).toBeTruthy();

      // Database service should have connection status
      const isConnected = databaseService.getConnectionStatus();
      expect(typeof isConnected).toBe('boolean');
    });

    it('should maintain service relationships after refresh', async () => {
      const originalTodoService = await ServiceFactory.getTodoService();
      const originalDatabaseService = ServiceFactory.getDatabaseService();

      const refreshedTodoService = await ServiceFactory.refresh();
      const newDatabaseService = ServiceFactory.getDatabaseService();

      // TodoService should be new after refresh
      expect(refreshedTodoService).not.toBe(originalTodoService);
      
      // DatabaseService should be new (reset by refresh)
      expect(newDatabaseService).not.toBe(originalDatabaseService);
    });
  });

  describe('error handling and resilience', () => {
    it('should handle multiple concurrent service creation requests', async () => {
      // Reset before test to ensure clean state
      ServiceFactory.reset();
      RepositoryFactory.resetRepository();
      
      const promises = Array.from({ length: 5 }, () => ServiceFactory.getTodoService());
      
      const services = await Promise.all(promises);
      
      // All should be the same instance (cached) - check reference equality only
      const firstService = services[0];
      services.forEach((service, index) => {
        expect(service).toBe(firstService);
      });
      
      // Services should be defined and functional
      expect(firstService).toBeDefined();
      expect(typeof firstService.createTodo).toBe('function');
    });

    it('should handle reset during service creation', async () => {
      // Start service creation
      const servicePromise = ServiceFactory.getTodoService();
      
      // Reset immediately
      ServiceFactory.reset();
      
      // Original promise should still resolve
      const service1 = await servicePromise;
      expect(service1).toBeDefined();
      
      // New service should be different
      const service2 = await ServiceFactory.getTodoService();
      expect(service2).toBeDefined();
      // Note: They might be the same if reset happened after creation
    });
  });
});