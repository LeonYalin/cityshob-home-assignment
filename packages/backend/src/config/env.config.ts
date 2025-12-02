/**
 * Centralized environment variable configuration
 * Validates all required environment variables at startup
 */

export interface EnvironmentConfig {
  // Server configuration
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  
  // JWT configuration
  jwtSecret: string;
  jwtExpiresIn: string;
  
  // Database configuration
  mongodbUri?: string;
  
  // Socket.IO configuration
  socketOriginWhitelist: string[];
  
  // Logging configuration
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

/**
 * Load and validate environment variables
 * @throws {Error} if required environment variables are missing in production
 */
export function loadEnvironmentConfig(): EnvironmentConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';
  const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
  
  // Validate critical environment variables in production
  if (nodeEnv === 'production') {
    if (jwtSecret === 'your-super-secret-jwt-key-change-in-production') {
      throw new Error(
        'FATAL: JWT_SECRET must be set to a secure value in production. ' +
        'Please set the JWT_SECRET environment variable.'
      );
    }
    
    if (!process.env.MONGODB_URI) {
      console.warn(
        'WARNING: MONGODB_URI is not set in production. ' +
        'Running with in-memory storage (data will be lost on restart).'
      );
    }
  }
  
  return {
    port: parseInt(process.env.PORT || '4000', 10),
    nodeEnv,
    jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    mongodbUri: process.env.MONGODB_URI,
    socketOriginWhitelist: process.env.SOCKET_ORIGIN_WHITELIST?.split(',') || ['http://localhost:4200'],
    logLevel: (process.env.LOG_LEVEL || 'info') as 'error' | 'warn' | 'info' | 'debug'
  };
}

// Export singleton instance
export const config = loadEnvironmentConfig();
