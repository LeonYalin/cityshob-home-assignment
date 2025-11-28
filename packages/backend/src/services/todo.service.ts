import { TodoDoc } from '../models/todo.model';
import { CreateTodoInput, UpdateTodoInput, TodoQueryParams } from '../schemas/todo.schema';
import { NotFoundError, DatabaseConnectionError, TodoLockError } from '../errors';
import { Logger } from './logger.service';
import { ITodoRepository } from '../repositories/interfaces/todo-repository.interface';

export class TodoService {
  constructor(
    private readonly todoRepository: ITodoRepository,
    private readonly logger: Logger
  ) {}

  async getAllTodos(
    queryParams: TodoQueryParams = { limit: 10, page: 1 }, 
    userId?: string
  ): Promise<TodoDoc[]> {
    try {
      this.logger.info('Fetching todos', { ...queryParams, userId });
      const todos = await this.todoRepository.findAll(queryParams, userId);
      this.logger.info(`Found ${todos.length} todos for user ${userId || 'anonymous'}`);
      return todos;
    } catch (error) {
      this.logger.error('Error fetching todos:', error);
      throw new DatabaseConnectionError('Failed to fetch todos');
    }
  }

  async getTodoById(id: string): Promise<TodoDoc | null> {
    try {
        this.logger.info(`Fetching todo with id: ${id}`);
        const todo = await this.todoRepository.findById(id);
        if (todo) {
          this.logger.info(`Found todo: ${todo.title}`);
        } else {
          this.logger.warn(`Todo not found with id: ${id}`);
        }
        return todo;
      } catch (error) {
        this.logger.error(`Error fetching todo with id ${id}:`, error);
        if (error instanceof Error && error.name === 'CastError') {
          throw new NotFoundError(`Invalid todo ID format: ${id}`);
        }
        throw new DatabaseConnectionError('Failed to fetch todo');
      }
    }

    async createTodo(input: CreateTodoInput, userId: string): Promise<TodoDoc> {
      try {
        this.logger.info('Creating new todo', { ...input, userId });
        const todoData = { ...input, createdBy: userId };
        const todo = await this.todoRepository.create(todoData);
        this.logger.info(`Created todo with id: ${todo.id} for user: ${userId}`);
        return todo;
      } catch (error) {
        this.logger.error('Error creating todo:', error);
        throw new DatabaseConnectionError('Failed to create todo');
      }
    }

    async updateTodo(id: string, updateData: UpdateTodoInput, userId?: string): Promise<TodoDoc | null> {
      try {
        this.logger.info(`Updating todo with id: ${id}`, { ...updateData, userId });
        const updatedTodo = await this.todoRepository.update(id, updateData, userId);
        if (updatedTodo) {
          this.logger.info(`Updated todo with id: ${id}`);
        } else {
          this.logger.warn(`Todo not found for update with id: ${id}`);
        }
        return updatedTodo;
      } catch (error) {
        this.logger.error(`Error updating todo with id ${id}:`, error);
        if (error instanceof TodoLockError) {
          throw error;
        }
        if (error instanceof Error && error.name === 'CastError') {
          throw new NotFoundError(`Invalid todo ID format: ${id}`);
        }
        throw new DatabaseConnectionError('Failed to update todo');
      }
    }

    async deleteTodo(id: string, userId?: string): Promise<boolean> {
      try {
        this.logger.info(`Deleting todo with id: ${id}`);
        const deleted = await this.todoRepository.delete(id, userId);
        if (deleted) {
          this.logger.info(`Deleted todo with id: ${id}`);
        } else {
          this.logger.warn(`Todo not found for deletion with id: ${id}`);
        }
        return deleted;
      } catch (error) {
        this.logger.error(`Error deleting todo with id ${id}:`, error);
        if (error instanceof TodoLockError) {
          throw error;
        }
        if (error instanceof Error && error.name === 'CastError') {
          throw new NotFoundError(`Invalid todo ID format: ${id}`);
        }
        throw new DatabaseConnectionError('Failed to delete todo');
      }
    }

    async toggleTodo(id: string): Promise<TodoDoc | null> {
      try {
        this.logger.info(`Toggling todo completion with id: ${id}`);
        const updatedTodo = await this.todoRepository.toggleCompletion(id);
        if (updatedTodo) {
          this.logger.info(`Toggled todo with id: ${id}, completed: ${updatedTodo.completed}`);
        } else {
          this.logger.warn(`Todo not found for toggle with id: ${id}`);
        }
        return updatedTodo;
      } catch (error) {
        this.logger.error(`Error toggling todo with id ${id}:`, error);
        if (error instanceof Error && error.name === 'CastError') {
          throw new NotFoundError(`Invalid todo ID format: ${id}`);
        }
        throw new DatabaseConnectionError('Failed to toggle todo');
      }
    }

    async lockTodo(id: string, userId: string = 'anonymous'): Promise<TodoDoc | null> {
      try {
        this.logger.info(`Locking todo with id: ${id} for user: ${userId}`);
        const lockedTodo = await this.todoRepository.findByIdAndLock(id, userId);
        if (lockedTodo) {
          this.logger.info(`Successfully locked todo with id: ${id}`);
        } else {
          this.logger.warn(`Failed to lock todo with id: ${id} - may already be locked or not found`);
        }
        return lockedTodo;
      } catch (error) {
        this.logger.error(`Error locking todo with id ${id}:`, error);
        throw new DatabaseConnectionError('Failed to lock todo');
      }
    }

    async unlockTodo(id: string, userId?: string): Promise<void> {
      try {
        this.logger.info(`Unlocking todo with id: ${id} for user: ${userId}`);
        await this.todoRepository.unlock(id, userId);
        this.logger.info(`Successfully unlocked todo with id: ${id}`);
      } catch (error) {
        this.logger.error(`Error unlocking todo with id ${id}:`, error);
        throw new DatabaseConnectionError('Failed to unlock todo');
      }
    }

    async isTodoLocked(id: string): Promise<boolean> {
      try {
        return await this.todoRepository.isLocked(id);
      } catch (error) {
        this.logger.error(`Error checking lock status for todo with id ${id}:`, error);
        return false;
      }
    }

    async getTodosByStatus(completed: boolean, queryParams: TodoQueryParams = { limit: 10, page: 1 }): Promise<TodoDoc[]> {
      try {
        this.logger.info(`Fetching todos with completed=${completed}`, queryParams);
        const todos = await this.todoRepository.findByStatus(completed, queryParams);
        this.logger.info(`Found ${todos.length} todos with completed=${completed}`);
        return todos;
      } catch (error) {
        this.logger.error(`Error fetching todos by status completed=${completed}:`, error);
        throw new DatabaseConnectionError('Failed to fetch todos by status');
      }
    }

    async getTodosByPriority(priority: 'low' | 'medium' | 'high', queryParams: TodoQueryParams = { limit: 10, page: 1 }): Promise<TodoDoc[]> {
      try {
        this.logger.info(`Fetching todos with priority=${priority}`, queryParams);
        const todos = await this.todoRepository.findByPriority(priority, queryParams);
        this.logger.info(`Found ${todos.length} todos with priority=${priority}`);
        return todos;
      } catch (error) {
        this.logger.error(`Error fetching todos by priority=${priority}:`, error);
        throw new DatabaseConnectionError('Failed to fetch todos by priority');
      }
    }

    async getTodoCount(filter: any = {}): Promise<number> {
      try {
        const count = await this.todoRepository.count(filter);
        this.logger.info(`Total todo count: ${count}`, filter);
        return count;
      } catch (error) {
        this.logger.error('Error getting todo count:', error);
        throw new DatabaseConnectionError('Failed to get todo count');
      }
    }
  }