/**
 * Base API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: string;
  service: string;
  environment: string;
  timestamp: string;
  uptime: number;
}

/**
 * Error response
 */
export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  statusCode?: number;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
}
