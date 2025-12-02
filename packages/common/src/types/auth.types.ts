import { ApiResponse } from './api.types';

/**
 * User interface
 */
export interface User {
  id: string;
  username: string;
  email: string;
  /** ISO 8601 date string
   * @example "2024-12-02T10:00:00.000Z"
   */
  createdAt: string;
  /** ISO 8601 date string
   * @example "2024-12-02T10:00:00.000Z"
   */
  updatedAt: string;
}

/**
 * Register request
 */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

/**
 * Auth data response
 */
export interface AuthData {
  user: User;
  token?: string;
}

/**
 * Register response
 */
export type RegisterResponse = ApiResponse<AuthData>;

/**
 * Login request
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response
 */
export type LoginResponse = ApiResponse<AuthData>;

/**
 * Logout response
 */
export type LogoutResponse = ApiResponse<void>;

/**
 * Get current user response
 */
export type GetCurrentUserResponse = ApiResponse<{ user: User }>
