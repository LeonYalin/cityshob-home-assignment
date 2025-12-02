import { ApiResponse, PaginatedResponse } from './api.types';

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
  /** ISO 8601 date string
   * @example "2024-12-02T10:00:00.000Z"
   */
  createdAt: string;
  /** ISO 8601 date string
   * @example "2024-12-02T10:00:00.000Z"
   */
  updatedAt: string;
  lockedBy?: string;
  /** ISO 8601 date string
   * @example "2024-12-02T10:00:00.000Z"
   */
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
export type CreateTodoResponse = ApiResponse<Todo>;

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
export type UpdateTodoResponse = ApiResponse<Todo>;

/**
 * Get todo response
 */
export type GetTodoResponse = ApiResponse<Todo>;

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
 * Get all todos response with pagination
 */
export type GetTodosResponse = ApiResponse<PaginatedResponse<Todo>>;

/**
 * Delete todo response
 */
export type DeleteTodoResponse = ApiResponse<void>;

/**
 * Toggle todo response
 */
export type ToggleTodoResponse = ApiResponse<Todo>;

/**
 * Lock todo data
 */
export interface LockTodoData {
  id: string;
  lockedBy: string;
  /** ISO 8601 date string
   * @example "2024-12-02T10:00:00.000Z"
   */
  lockedAt: string;
}

/**
 * Lock todo response
 */
export type LockTodoResponse = ApiResponse<LockTodoData>;

/**
 * Unlock todo response
 */
export type UnlockTodoResponse = ApiResponse<void>
