import { TodoDoc } from '../../models/todo.model';
import { CreateTodoInput, UpdateTodoInput, TodoQueryParams } from '../../schemas/todo.schema';

export interface ITodoRepository {
  // Basic CRUD operations
  findAll(queryParams?: TodoQueryParams, userId?: string): Promise<TodoDoc[]>;
  findById(id: string, userId?: string): Promise<TodoDoc | null>;
  create(todoData: CreateTodoInput & { createdBy: string }): Promise<TodoDoc>;
  update(id: string, updateData: UpdateTodoInput, userId?: string): Promise<TodoDoc | null>;
  delete(id: string, userId?: string): Promise<boolean>;
  
  // Special operations
  toggleCompletion(id: string, userId?: string): Promise<TodoDoc | null>;
  
  // Locking operations for real-time collaboration
  findByIdAndLock(id: string, userId: string): Promise<TodoDoc | null>;
  unlock(id: string, userId?: string): Promise<void>;
  isLocked(id: string): Promise<boolean>;
  
  // Query operations
  findByStatus(completed: boolean, queryParams?: TodoQueryParams, userId?: string): Promise<TodoDoc[]>;
  findByPriority(priority: 'low' | 'medium' | 'high', queryParams?: TodoQueryParams, userId?: string): Promise<TodoDoc[]>;
  count(filter?: any): Promise<number>;
  
  // Health check
  ping(): Promise<boolean>;
}