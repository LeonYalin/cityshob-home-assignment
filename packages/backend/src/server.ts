import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { apiRoutes } from './routes';
import { errorHandler } from './middleware/error-handler.middleware';
import { morganMiddleware } from './middleware/morgan.middleware';
import { Logger } from './services/logger.service';
import { ServiceFactory } from './services/service.factory';
import { SocketService } from './socket/socket.service';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const logger = new Logger('Server');

// Initialize database connection
const initializeDatabase = async () => {
  try {
    const databaseService = ServiceFactory.getDatabaseService();
    await databaseService.connect();
  } catch (error) {
    // Don't exit on database connection failure - continue with in-memory fallback
    logger.warn('Database initialization failed, continuing with in-memory storage:', error);
  }
};

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
}));

// Use winston-morgan integration for request logging
app.use(morganMiddleware);

app.use(cors({
  origin: process.env.SOCKET_ORIGIN_WHITELIST?.split(',') || ['http://localhost:4200'],
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', apiRoutes);

// Serve Angular frontend in production
if (NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  
  // Serve static files
  app.use(express.static(frontendPath));
  
  // Catch all handler: send back Angular's index.html file for client-side routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  // Development: Basic root route
  app.get('/', (req, res) => {
    res.json({
      message: '🚀 Real-Time Todo API Server is running!',
      environment: 'development',
      endpoints: {
        health: '/api/health',
        todos: '/api/todos',
      },
      frontend: 'http://localhost:4200',
      timestamp: new Date().toISOString(),
    });
  });
}

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  logger.warn(`API endpoint not found: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

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
    httpServer.listen(PORT, () => {
      const databaseService = ServiceFactory.getDatabaseService();
      
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`📋 Environment: ${NODE_ENV}`);
      logger.info(`🔍 Health check: http://localhost:${PORT}/api/health`);
      logger.info(`📋 Todos API: http://localhost:${PORT}/api/todos`);
      logger.info(`🔌 WebSocket: Available on port ${PORT}`);
      
      if (databaseService.getConnectionStatus()) {
        logger.info(`🗄️ Database: Connected to MongoDB`);
      } else {
        logger.info(`🗄️ Database: Running in fallback mode (in-memory storage)`);
        logger.info(`💡 To use MongoDB: Set MONGODB_URI environment variable and restart`);
      }
      
      if (NODE_ENV === 'production') {
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
  const databaseService = ServiceFactory.getDatabaseService();
  await databaseService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  const databaseService = ServiceFactory.getDatabaseService();
  await databaseService.disconnect();
  process.exit(0);
});

// Start the server only if this file is run directly (not imported)
if (require.main === module) {
  startServer();
}

export default app;