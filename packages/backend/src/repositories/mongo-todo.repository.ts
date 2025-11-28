import { Todo, TodoDoc } from '../models/todo.model';
import { CreateTodoInput, UpdateTodoInput, TodoQueryParams } from '../schemas/todo.schema';
import { ITodoRepository } from './interfaces/todo-repository.interface';
import { Logger } from '../services/logger.service';
import { TodoLockError } from '../errors';

export class MongoTodoRepository implements ITodoRepository {
  constructor(private readonly logger: Logger) {}

  /**
   * Check if a todo is locked by another user
   * @throws {TodoLockError} if todo is locked by another user
   */
  private async checkTodoLock(id: string, userId?: string): Promise<void> {
    const existingTodo = await Todo.findById(id).exec();
    if (existingTodo && existingTodo.isLocked) {
      const lockExpired = existingTodo.lockedAt && 
        existingTodo.lockedAt < new Date(Date.now() - 5 * 60 * 1000);
      
      if (!lockExpired && existingTodo.lockedBy !== userId) {
        this.logger.warn(`Cannot modify todo ${id}: locked by user ${existingTodo.lockedBy}`);
        throw new TodoLockError(`Todo is locked by another user`);
      }
    }
  }
  
  async findAll(queryParams: TodoQueryParams = { limit: 10, page: 1 }): Promise<TodoDoc[]> {
    try {
      const { completed, priority, limit, page } = queryParams;
      
      // Build filter object
      const filter: any = {};
      if (completed !== undefined) {
        filter.completed = completed;
      }
      if (priority) {
        filter.priority = priority;
      }

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const todos = await Todo.find(filter)
        .sort({ createdAt: -1 }) // Most recent first
        .limit(limit)
        .skip(skip)
        .exec();
      
      this.logger.debug(`Found ${todos.length} todos`, { filter, pagination: { page, limit, skip } });
      return todos;
    } catch (error) {
      this.logger.error('Error in findAll', error);
      throw error;
    }
  }

  async findById(id: string): Promise<TodoDoc | null> {
    try {
      this.logger.debug(`MongoTodoRepository: Finding todo by id: ${id}`);
      const todo = await Todo.findById(id).exec();
      return todo;
    } catch (error) {
      this.logger.error(`MongoTodoRepository: Error in findById for id ${id}`, error);
      throw error;
    }
  }

  async create(todoData: CreateTodoInput): Promise<TodoDoc> {
    try {
      this.logger.debug('MongoTodoRepository: Creating new todo', todoData);
      const todo = new Todo(todoData);
      const savedTodo = await todo.save();
      this.logger.debug(`MongoTodoRepository: Created todo with id: ${savedTodo.id}`);
      return savedTodo;
    } catch (error) {
      this.logger.error('MongoTodoRepository: Error in create', error);
      throw error;
    }
  }

  async update(id: string, updateData: UpdateTodoInput, userId?: string): Promise<TodoDoc | null> {
    try {
      this.logger.debug(`MongoTodoRepository: Updating todo with id: ${id}`, updateData);
      
      // Check if todo is locked by another user
      await this.checkTodoLock(id, userId);
      
      const updatedTodo = await Todo.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).exec();

      if (updatedTodo) {
        this.logger.debug(`MongoTodoRepository: Updated todo with id: ${id}`);
      }
      
      return updatedTodo;
    } catch (error) {
      this.logger.error(`MongoTodoRepository: Error in update for id ${id}`, error);
      throw error;
    }
  }

  async delete(id: string, userId?: string): Promise<boolean> {
    try {
      this.logger.debug(`MongoTodoRepository: Deleting todo with id: ${id}`);
      
      // Check if todo is locked by another user
      await this.checkTodoLock(id, userId);
      
      const deletedTodo = await Todo.findByIdAndDelete(id).exec();
      const wasDeleted = !!deletedTodo;
      
      if (wasDeleted) {
        this.logger.debug(`MongoTodoRepository: Deleted todo with id: ${id}`);
      }
      
      return wasDeleted;
    } catch (error) {
      this.logger.error(`MongoTodoRepository: Error in delete for id ${id}`, error);
      throw error;
    }
  }

  async toggleCompletion(id: string): Promise<TodoDoc | null> {
    try {
      this.logger.debug(`MongoTodoRepository: Toggling completion for todo with id: ${id}`);
      
      // First get the current todo to get its completed state
      const currentTodo = await Todo.findById(id).exec();
      if (!currentTodo) {
        return null;
      }

      // Update with opposite of current completed state
      const updatedTodo = await Todo.findByIdAndUpdate(
        id,
        { 
          completed: !currentTodo.completed,
          updatedAt: new Date()
        },
        { new: true }
      ).exec();

      if (updatedTodo) {
        this.logger.debug(`MongoTodoRepository: Toggled todo with id: ${id}, completed: ${updatedTodo.completed}`);
      }
      
      return updatedTodo;
    } catch (error) {
      this.logger.error(`MongoTodoRepository: Error in toggleCompletion for id ${id}`, error);
      throw error;
    }
  }

  async findByIdAndLock(id: string, userId: string = 'anonymous'): Promise<TodoDoc | null> {
    try {
      this.logger.debug(`MongoTodoRepository: Locking todo with id: ${id} for user: ${userId}`);
      
      const lockedTodo = await Todo.findByIdAndLock(id, userId);
      
      if (lockedTodo) {
        this.logger.debug(`MongoTodoRepository: Successfully locked todo with id: ${id}`);
      }
      
      return lockedTodo;
    } catch (error) {
      this.logger.error(`MongoTodoRepository: Error in findByIdAndLock for id ${id}`, error);
      throw error;
    }
  }

  async unlock(id: string): Promise<void> {
    try {
      this.logger.debug(`MongoTodoRepository: Unlocking todo with id: ${id}`);
      await Todo.unlockTodo(id);
      this.logger.debug(`MongoTodoRepository: Successfully unlocked todo with id: ${id}`);
    } catch (error) {
      this.logger.error(`MongoTodoRepository: Error in unlock for id ${id}`, error);
      throw error;
    }
  }

  async isLocked(id: string): Promise<boolean> {
    try {
      const todo = await Todo.findById(id).select('isLocked lockedAt').exec();
      if (!todo) {
        return false;
      }
      
      // Check if locked and not expired (5 minute timeout)
      const isLocked = !!(todo.isLocked && 
        todo.lockedAt && 
        (new Date().getTime() - todo.lockedAt.getTime()) < 5 * 60 * 1000);
      
      return isLocked;
    } catch (error) {
      this.logger.error(`MongoTodoRepository: Error in isLocked for id ${id}`, error);
      throw error;
    }
  }

  async findByStatus(completed: boolean, queryParams: TodoQueryParams = { limit: 10, page: 1 }): Promise<TodoDoc[]> {
    try {
      const filter = { completed };
      const { limit, page } = queryParams;
      const skip = (page - 1) * limit;
      
      const todos = await Todo.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .exec();
      
      this.logger.debug(`MongoTodoRepository: Found ${todos.length} todos with completed=${completed}`);
      return todos;
    } catch (error) {
      this.logger.error(`MongoTodoRepository: Error in findByStatus for completed=${completed}`, error);
      throw error;
    }
  }

  async findByPriority(priority: 'low' | 'medium' | 'high', queryParams: TodoQueryParams = { limit: 10, page: 1 }): Promise<TodoDoc[]> {
    try {
      const filter = { priority };
      const { limit, page } = queryParams;
      const skip = (page - 1) * limit;
      
      const todos = await Todo.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .exec();
      
      this.logger.debug(`MongoTodoRepository: Found ${todos.length} todos with priority=${priority}`);
      return todos;
    } catch (error) {
      this.logger.error(`MongoTodoRepository: Error in findByPriority for priority=${priority}`, error);
      throw error;
    }
  }

  async count(filter: any = {}): Promise<number> {
    try {
      const count = await Todo.countDocuments(filter).exec();
      this.logger.debug(`MongoTodoRepository: Count query returned ${count} todos`, filter);
      return count;
    } catch (error) {
      this.logger.error('MongoTodoRepository: Error in count', error);
      throw error;
    }
  }

  async ping(): Promise<boolean> {
    try {
      // Simple operation to test database connectivity
      await Todo.findOne().limit(1).exec();
      return true;
    } catch (error) {
      this.logger.error('MongoTodoRepository: Database ping failed', error);
      return false;
    }
  }
}