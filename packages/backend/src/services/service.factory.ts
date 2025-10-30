import { TodoService } from './todo.service';
import { Logger } from './logger.service';
import { RepositoryFactory } from '../repositories/repository.factory';
import { DatabaseService } from './database.service';

export class ServiceFactory {
  private static todoServiceInstance: TodoService | null = null;
  private static todoServicePromise: Promise<TodoService> | null = null;
  private static databaseServiceInstance: DatabaseService | null = null;

  static async getTodoService(): Promise<TodoService> {
    if (this.todoServiceInstance) {
      return this.todoServiceInstance;
    }
    
    if (this.todoServicePromise) {
      return this.todoServicePromise;
    }
    
    this.todoServicePromise = this.createTodoService();
    this.todoServiceInstance = await this.todoServicePromise;
    this.todoServicePromise = null;
    
    return this.todoServiceInstance;
  }
  
  private static async createTodoService(): Promise<TodoService> {
    const repository = await RepositoryFactory.getTodoRepository();
    const logger = new Logger('TodoService');
    return new TodoService(repository, logger);
  }

  static getDatabaseService(): DatabaseService {
    if (!this.databaseServiceInstance) {
      const logger = new Logger('DatabaseService');
      this.databaseServiceInstance = DatabaseService.getInstance(logger);
    }
    return this.databaseServiceInstance;
  }

  // Reset for testing purposes
  static reset(): void {
    this.todoServiceInstance = null;
    this.todoServicePromise = null;
    this.databaseServiceInstance = null;
    // Reset the DatabaseService singleton as well
    (DatabaseService as any).instance = undefined;
  }

  // Force refresh - useful when repository configuration changes
  static async refresh(): Promise<TodoService> {
    this.reset();
    return this.getTodoService();
  }
}