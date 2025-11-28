/**
 * Priority enum for todos
 */
export type Priority = 'low' | 'medium' | 'high';

/**
 * Base Todo interface
 */
export interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: Priority;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lockedBy?: string;
  lockedAt?: string;
}

/**
 * Create todo request
 */
export interface CreateTodoRequest {
  title: string;
  description?: string;
  priority?: Priority;
}

/**
 * Create todo response
 */
export interface CreateTodoResponse {
  success: boolean;
  message: string;
  data: Todo;
}

/**
 * Update todo request
 */
export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: Priority;
}

/**
 * Update todo response
 */
export interface UpdateTodoResponse {
  success: boolean;
  message: string;
  data: Todo;
}

/**
 * Get todo response
 */
export interface GetTodoResponse {
  success: boolean;
  data: Todo;
}

/**
 * Get all todos query parameters
 */
export interface GetTodosQueryParams {
  completed?: boolean;
  priority?: Priority;
  limit?: number;
  page?: number;
}

/**
 * Get all todos response
 */
export interface GetTodosResponse {
  success: boolean;
  data: Todo[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

/**
 * Delete todo response
 */
export interface DeleteTodoResponse {
  success: boolean;
  message: string;
}

/**
 * Toggle todo response
 */
export interface ToggleTodoResponse {
  success: boolean;
  message: string;
  data: Todo;
}

/**
 * Lock todo response
 */
export interface LockTodoResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    lockedBy: string;
    lockedAt: string;
  };
}

/**
 * Unlock todo response
 */
export interface UnlockTodoResponse {
  success: boolean;
  message: string;
}
