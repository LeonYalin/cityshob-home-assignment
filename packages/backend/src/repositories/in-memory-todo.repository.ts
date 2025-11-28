import { TodoDoc } from '../models/todo.model';
import { CreateTodoInput, UpdateTodoInput, TodoQueryParams } from '../schemas/todo.schema';
import { ITodoRepository } from './interfaces/todo-repository.interface';
import { Logger } from '../services/logger.service';
import { TodoLockError } from '../errors';

// In-memory Todo implementation for fallback mode
interface InMemoryTodo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isLocked: boolean;
  lockedBy: string | null;
  lockedAt: Date | null;
}

export class InMemoryTodoRepository implements ITodoRepository {
  private todos: InMemoryTodo[] = [];
  
  private nextId = 1;

  constructor(private readonly logger: Logger) {}

  /**
   * Convert InMemoryTodo to TodoDoc-like object with toJSON method
   */
  private toTodoDoc(todo: InMemoryTodo): TodoDoc {
    const todoWithMethods = {
      ...todo,
      _id: todo.id,
      toJSON: function() {
        return {
          id: this.id,
          title: this.title,
          description: this.description,
          completed: this.completed,
          priority: this.priority,
          createdBy: this.createdBy || '',
          createdAt: this.createdAt,
          updatedAt: this.updatedAt,
          lockedBy: this.lockedBy,
          lockedAt: this.lockedAt
        };
      }
    } as any as TodoDoc;
    
    return todoWithMethods;
  }

  /**
   * Check if a todo is locked by another user
   * @throws {TodoLockError} if todo is locked by another user
   */
  private checkTodoLock(todo: InMemoryTodo, userId?: string): void {
    if (todo.isLocked && todo.lockedAt) {
      const lockExpired = (new Date().getTime() - todo.lockedAt.getTime()) >= 5 * 60 * 1000;
      
      if (!lockExpired && todo.lockedBy !== userId) {
        this.logger.warn(`Cannot modify todo ${todo.id}: locked by user ${todo.lockedBy}`);
        throw new TodoLockError(`Todo is locked by another user`);
      }
    }
  }

  async findAll(queryParams: TodoQueryParams = { limit: 10, page: 1 }): Promise<TodoDoc[]> {
    try {
      const { completed, priority, limit, page } = queryParams;
      
      // Apply filters
      let filteredTodos = this.todos;
      
      if (completed !== undefined) {
        filteredTodos = filteredTodos.filter(todo => todo.completed === completed);
      }
      
      if (priority) {
        filteredTodos = filteredTodos.filter(todo => todo.priority === priority);
      }

      // Apply pagination
      const skip = (page - 1) * limit;
      const paginatedTodos = filteredTodos
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) // Most recent first
        .slice(skip, skip + limit);
      
      this.logger.debug(`InMemoryTodoRepository: Found ${paginatedTodos.length} todos`);
      return paginatedTodos.map(todo => this.toTodoDoc(todo));
    } catch (error) {
      this.logger.error('InMemoryTodoRepository: Error in findAll', error);
      throw error;
    }
  }

  async findById(id: string): Promise<TodoDoc | null> {
    try {
      this.logger.debug(`InMemoryTodoRepository: Finding todo by id: ${id}`);
      const todo = this.todos.find(t => t.id === id);
      return todo ? this.toTodoDoc(todo) : null;
    } catch (error) {
      this.logger.error(`InMemoryTodoRepository: Error in findById for id ${id}`, error);
      throw error;
    }
  }

  async create(todoData: CreateTodoInput & { createdBy: string }): Promise<TodoDoc> {
    try {
      this.logger.debug('InMemoryTodoRepository: Creating new todo', todoData);
      
      const newTodo: InMemoryTodo = {
        id: this.nextId.toString(),
        title: todoData.title,
        description: todoData.description || '',
        completed: false,
        priority: todoData.priority || 'medium',
        createdBy: todoData.createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
        isLocked: false,
        lockedBy: null,
        lockedAt: null,
      };
      
      this.todos.push(newTodo);
      this.nextId++;
      
      this.logger.debug(`InMemoryTodoRepository: Created todo with id: ${newTodo.id}`);
      return this.toTodoDoc(newTodo);
    } catch (error) {
      this.logger.error('InMemoryTodoRepository: Error in create', error);
      throw error;
    }
  }

  async update(id: string, updateData: UpdateTodoInput, userId?: string): Promise<TodoDoc | null> {
    try {
      this.logger.debug(`InMemoryTodoRepository: Updating todo with id: ${id}`, updateData);
      
      const todoIndex = this.todos.findIndex(t => t.id === id);
      if (todoIndex === -1) {
        return null;
      }

      // Check if todo is locked by another user
      this.checkTodoLock(this.todos[todoIndex], userId);

      const updatedTodo: InMemoryTodo = {
        ...this.todos[todoIndex],
        ...updateData,
        updatedAt: new Date()
      };

      this.todos[todoIndex] = updatedTodo;
      this.logger.debug(`InMemoryTodoRepository: Updated todo with id: ${id}`);
      return this.toTodoDoc(updatedTodo);
    } catch (error) {
      this.logger.error(`InMemoryTodoRepository: Error in update for id ${id}`, error);
      throw error;
    }
  }

  async delete(id: string, userId?: string): Promise<boolean> {
    try {
      this.logger.debug(`InMemoryTodoRepository: Deleting todo with id: ${id}`);
      
      const todo = this.todos.find(t => t.id === id);
      if (todo) {
        // Check if todo is locked by another user
        this.checkTodoLock(todo, userId);
      }
      
      const initialLength = this.todos.length;
      this.todos = this.todos.filter(t => t.id !== id);
      
      const wasDeleted = this.todos.length < initialLength;
      if (wasDeleted) {
        this.logger.debug(`InMemoryTodoRepository: Deleted todo with id: ${id}`);
      }
      
      return wasDeleted;
    } catch (error) {
      this.logger.error(`InMemoryTodoRepository: Error in delete for id ${id}`, error);
      throw error;
    }
  }

  async toggleCompletion(id: string): Promise<TodoDoc | null> {
    try {
      this.logger.debug(`InMemoryTodoRepository: Toggling completion for todo with id: ${id}`);
      
      const todoIndex = this.todos.findIndex(t => t.id === id);
      if (todoIndex === -1) {
        return null;
      }

      this.todos[todoIndex] = {
        ...this.todos[todoIndex],
        completed: !this.todos[todoIndex].completed,
        updatedAt: new Date()
      };

      this.logger.debug(`InMemoryTodoRepository: Toggled todo with id: ${id}, completed: ${this.todos[todoIndex].completed}`);
      return this.toTodoDoc(this.todos[todoIndex]);
    } catch (error) {
      this.logger.error(`InMemoryTodoRepository: Error in toggleCompletion for id ${id}`, error);
      throw error;
    }
  }

  async findByIdAndLock(id: string, userId: string = 'anonymous'): Promise<TodoDoc | null> {
    try {
      this.logger.debug(`InMemoryTodoRepository: Locking todo with id: ${id} for user: ${userId}`);
      
      const todoIndex = this.todos.findIndex(t => t.id === id);
      if (todoIndex === -1) {
        return null;
      }

      const todo = this.todos[todoIndex];
      
      // Check if already locked and not expired
      if (todo.isLocked && todo.lockedAt && 
          (new Date().getTime() - todo.lockedAt.getTime()) < 5 * 60 * 1000) {
        return null; // Already locked
      }

      // Lock the todo
      this.todos[todoIndex] = {
        ...todo,
        isLocked: true,
        lockedBy: userId,
        lockedAt: new Date()
      };

      this.logger.debug(`InMemoryTodoRepository: Successfully locked todo with id: ${id}`);
      return this.toTodoDoc(this.todos[todoIndex]);
    } catch (error) {
      this.logger.error(`InMemoryTodoRepository: Error in findByIdAndLock for id ${id}`, error);
      throw error;
    }
  }

  async unlock(id: string): Promise<void> {
    try {
      this.logger.debug(`InMemoryTodoRepository: Unlocking todo with id: ${id}`);
      
      const todoIndex = this.todos.findIndex(t => t.id === id);
      if (todoIndex !== -1) {
        this.todos[todoIndex] = {
          ...this.todos[todoIndex],
          isLocked: false,
          lockedBy: null,
          lockedAt: null
        };
        this.logger.debug(`InMemoryTodoRepository: Successfully unlocked todo with id: ${id}`);
      }
    } catch (error) {
      this.logger.error(`InMemoryTodoRepository: Error in unlock for id ${id}`, error);
      throw error;
    }
  }

  async isLocked(id: string): Promise<boolean> {
    try {
      const todo = this.todos.find(t => t.id === id);
      if (!todo) {
        return false;
      }
      
      // Check if locked and not expired (5 minute timeout)
      const isLocked = !!(todo.isLocked && 
        todo.lockedAt && 
        (new Date().getTime() - todo.lockedAt.getTime()) < 5 * 60 * 1000);
      
      return isLocked;
    } catch (error) {
      this.logger.error(`InMemoryTodoRepository: Error in isLocked for id ${id}`, error);
      throw error;
    }
  }

  async findByStatus(completed: boolean, queryParams: TodoQueryParams = { limit: 10, page: 1 }): Promise<TodoDoc[]> {
    try {
      const filteredTodos = this.todos.filter(todo => todo.completed === completed);
      const { limit, page } = queryParams;
      const skip = (page - 1) * limit;
      
      const paginatedTodos = filteredTodos
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(skip, skip + limit);
      
      this.logger.debug(`InMemoryTodoRepository: Found ${paginatedTodos.length} todos with completed=${completed}`);
      return paginatedTodos.map(todo => this.toTodoDoc(todo));
    } catch (error) {
      this.logger.error(`InMemoryTodoRepository: Error in findByStatus for completed=${completed}`, error);
      throw error;
    }
  }

  async findByPriority(priority: 'low' | 'medium' | 'high', queryParams: TodoQueryParams = { limit: 10, page: 1 }): Promise<TodoDoc[]> {
    try {
      const filteredTodos = this.todos.filter(todo => todo.priority === priority);
      const { limit, page } = queryParams;
      const skip = (page - 1) * limit;
      
      const paginatedTodos = filteredTodos
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(skip, skip + limit);
      
      this.logger.debug(`InMemoryTodoRepository: Found ${paginatedTodos.length} todos with priority=${priority}`);
      return paginatedTodos.map(todo => this.toTodoDoc(todo));
    } catch (error) {
      this.logger.error(`InMemoryTodoRepository: Error in findByPriority for priority=${priority}`, error);
      throw error;
    }
  }

  async count(filter: any = {}): Promise<number> {
    try {
      let filteredTodos = this.todos;
      
      if (filter.completed !== undefined) {
        filteredTodos = filteredTodos.filter(todo => todo.completed === filter.completed);
      }
      
      if (filter.priority) {
        filteredTodos = filteredTodos.filter(todo => todo.priority === filter.priority);
      }
      
      this.logger.debug(`InMemoryTodoRepository: Count query returned ${filteredTodos.length} todos`, filter);
      return filteredTodos.length;
    } catch (error) {
      this.logger.error('InMemoryTodoRepository: Error in count', error);
      throw error;
    }
  }

  async ping(): Promise<boolean> {
    // In-memory repository is always available
    return true;
  }

  // Test utility method to clear all data
  clearAll(): void {
    this.todos = [];
    this.nextId = 1;
  }
}