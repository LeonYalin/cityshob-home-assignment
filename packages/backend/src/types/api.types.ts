import { Todo, Priority } from '../schemas/todo.schema';

// API Response wrapper for consistent response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Paginated response structure
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Todo-specific response types
export interface TodoResponse extends Todo {}

export interface TodoListResponse extends PaginatedResponse<TodoResponse> {}

export interface CreateTodoResponse extends ApiResponse<TodoResponse> {}

export interface UpdateTodoResponse extends ApiResponse<TodoResponse> {}

export interface DeleteTodoResponse extends ApiResponse<{ deleted: boolean }> {}

export interface ToggleTodoResponse extends ApiResponse<TodoResponse> {}

// Error response structure
export interface ErrorResponse extends ApiResponse<never> {
  success: false;
  error: string;
  details?: any;
}

// Health check response
export interface HealthResponse extends ApiResponse<{
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
}> {}