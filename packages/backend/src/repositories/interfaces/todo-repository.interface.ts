import { TodoDoc } from '../../models/todo.model';
import { CreateTodoInput, UpdateTodoInput, TodoQueryParams } from '../../schemas/todo.schema';

export interface ITodoRepository {
  // Basic CRUD operations
  findAll(queryParams?: TodoQueryParams): Promise<TodoDoc[]>;
  findById(id: string): Promise<TodoDoc | null>;
  create(todoData: CreateTodoInput): Promise<TodoDoc>;
  update(id: string, updateData: UpdateTodoInput): Promise<TodoDoc | null>;
  delete(id: string): Promise<boolean>;
  
  // Special operations
  toggleCompletion(id: string): Promise<TodoDoc | null>;
  
  // Locking operations for real-time collaboration
  findByIdAndLock(id: string, userId?: string): Promise<TodoDoc | null>;
  unlock(id: string): Promise<void>;
  isLocked(id: string): Promise<boolean>;
  
  // Query operations
  findByStatus(completed: boolean, queryParams?: TodoQueryParams): Promise<TodoDoc[]>;
  findByPriority(priority: 'low' | 'medium' | 'high', queryParams?: TodoQueryParams): Promise<TodoDoc[]>;
  count(filter?: any): Promise<number>;
  
  // Health check
  ping(): Promise<boolean>;
}