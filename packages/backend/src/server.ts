import dotenv from 'dotenv';
import { createServer } from 'http';
import { app, databaseService } from './app';
import { SocketService } from './services/socket.service';
import { Logger } from './services/logger.service';
import appConfig from './config/app.config';

// Load environment variables
dotenv.config();

const logger = new Logger('Server');

// Initialize database connection
const initializeDatabase = async () => {
  try {
    await databaseService.connect();
  } catch (error) {
    // Don't exit on database connection failure - continue with in-memory fallback
    logger.warn('Database initialization failed, continuing with in-memory storage:', error);
  }
};

// Start server with database initialization
let socketService: SocketService;

const startServer = async () => {
  try {
    // Initialize database first
    await initializeDatabase();
    
    // Create HTTP server from Express app
    const httpServer = createServer(app);
    
    // Initialize Socket.IO
    socketService = new SocketService(httpServer);
    logger.info('✓ Socket.IO service initialized');
    
    // Start server
    httpServer.listen(appConfig.port, () => {
      logger.info(`🚀 Server running on http://localhost:${appConfig.port}`);
      logger.info(`📋 Environment: ${appConfig.nodeEnv}`);
      logger.info(`🔍 Health check: http://localhost:${appConfig.port}/api/health`);
      logger.info(`📋 Todos API: http://localhost:${appConfig.port}/api/todos`);
      logger.info(`🔌 WebSocket: Available on port ${appConfig.port}`);
      
      if (databaseService.getConnectionStatus()) {
        logger.info(`🗄️ Database: Connected to MongoDB`);
      } else {
        logger.info(`🗄️ Database: Running in fallback mode (in-memory storage)`);
        logger.info(`💡 To use MongoDB: Set MONGODB_URI environment variable and restart`);
      }
      
      if (appConfig.nodeEnv === 'production') {
        logger.info(`🌐 Serving Angular frontend from /dist`);
      } else {
        logger.info(`🔧 Frontend dev server: http://localhost:4200`);
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Export socketService getter
export const getSocketService = () => socketService;

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await databaseService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await databaseService.disconnect();
  process.exit(0);
});

// Start the server only if this file is run directly (not imported)
if (require.main === module) {
  startServer();
}