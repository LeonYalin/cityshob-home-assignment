import { TodoService } from './todo.service';
import { Logger } from './logger.service';
import { RepositoryFactory } from '../repositories/repository.factory';
import { DatabaseService } from './database.service';

export class ServiceFactory {
  private static todoServiceInstance: TodoService | null = null;
  private static databaseServiceInstance: DatabaseService | null = null;

  static async getTodoService(): Promise<TodoService> {
    if (!this.todoServiceInstance) {
      const repository = await RepositoryFactory.getTodoRepository();
      const logger = new Logger('TodoService');
      this.todoServiceInstance = new TodoService(repository, logger);
    }
    return this.todoServiceInstance;
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
    this.databaseServiceInstance = null;
  }

  // Force refresh - useful when repository configuration changes
  static async refresh(): Promise<TodoService> {
    this.reset();
    return this.getTodoService();
  }
}