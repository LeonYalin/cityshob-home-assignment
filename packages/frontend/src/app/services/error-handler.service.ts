import { ErrorHandler, Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Global error handler service
 * Provides centralized error handling and logging
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  
  handleError(error: Error): void {
    // Log to console in development
    if (!environment.production) {
      console.error('Global error caught:', error);
      console.error('Stack trace:', error.stack);
    }

    // In production, you might want to:
    // 1. Send errors to a logging service (e.g., Sentry, LogRocket)
    // 2. Show user-friendly error messages
    // 3. Track error metrics
    
    // For now, we'll just log a production-safe message
    if (environment.production) {
      console.error('An error occurred. Please try again or contact support.');
    }
  }
}
