/**
 * User interface
 */
export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
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
 * Register response
 */
export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

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
export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

/**
 * Logout response
 */
export interface LogoutResponse {
  success: boolean;
  message: string;
}

/**
 * Get current user response
 */
export interface GetCurrentUserResponse {
  success: boolean;
  data: {
    user: User;
  };
}
