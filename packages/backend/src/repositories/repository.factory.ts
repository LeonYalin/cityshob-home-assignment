import { ITodoRepository } from './interfaces/todo-repository.interface';
import { MongoTodoRepository } from './mongo-todo.repository';
import { InMemoryTodoRepository } from './in-memory-todo.repository';
import { DatabaseService } from '../services/database.service';
import { Logger } from '../services/logger.service';

const logger = new Logger('RepositoryFactory');

export class RepositoryFactory {
  private static todoRepository: ITodoRepository;

  static async getTodoRepository(): Promise<ITodoRepository> {
    if (!this.todoRepository) {
      this.todoRepository = await this.createTodoRepository();
    }
    return this.todoRepository;
  }

  private static async createTodoRepository(): Promise<ITodoRepository> {
    try {
      // Check if MongoDB is available
      const databaseService = DatabaseService.getInstance();
      const isMongoAvailable = databaseService.getConnectionStatus();
      
      if (isMongoAvailable) {
        const mongoRepo = new MongoTodoRepository(logger);
        const canPing = await mongoRepo.ping();
        
        if (canPing) {
          logger.info('🗄️ Using MongoDB repository implementation');
          return mongoRepo;
        }
      }
      
      // Fallback to in-memory repository
      logger.info('🧠 Using in-memory repository implementation (fallback mode)');
      return new InMemoryTodoRepository(logger);
      
    } catch (error) {
      logger.warn('Failed to initialize MongoDB repository, falling back to in-memory implementation', error);
      return new InMemoryTodoRepository(logger);
    }
  }

  // Method to reset repository (useful for testing)
  static resetRepository(): void {
    this.todoRepository = undefined as any;
  }

  // Method to force specific repository type (useful for testing)
  static setTodoRepository(repository: ITodoRepository): void {
    this.todoRepository = repository;
  }
}