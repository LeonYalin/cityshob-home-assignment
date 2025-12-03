/**
 * Centralized application configuration
 * All environment variables are loaded and initialized here
 */

const appConfig = {
  // Server configuration
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
  
  // JWT configuration
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Database configuration
  mongodbUri: process.env.MONGODB_URI,
  
  // Socket.IO configuration
  socketOriginWhitelist: process.env.SOCKET_ORIGIN_WHITELIST?.split(',') || ['http://localhost:4200'],
  
  // Logging configuration
  logLevel: (process.env.LOG_LEVEL || 'info') as 'error' | 'warn' | 'info' | 'debug',
  
  // Cookie configuration
  cookieSecure: process.env.NODE_ENV === 'production',
  cookieSameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
  cookieMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

// Validate critical environment variables in production
if (appConfig.nodeEnv === 'production') {
  if (appConfig.jwtSecret === 'your-super-secret-jwt-key-change-in-production') {
    throw new Error(
      'FATAL: JWT_SECRET must be set to a secure value in production. ' +
      'Please set the JWT_SECRET environment variable.'
    );
  }
  
  if (!appConfig.mongodbUri) {
    console.warn(
      'WARNING: MONGODB_URI is not set in production. ' +
      'Running with in-memory storage (data will be lost on restart).'
    );
  }
}

export default appConfig;
