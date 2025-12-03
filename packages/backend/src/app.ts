import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { apiRoutes } from './routes';
import { errorHandler } from './middleware/error-handler.middleware';
import { morganMiddleware } from './middleware/morgan.middleware';
import { Logger } from './services/logger.service';
import { TodoService } from './services/todo.service';
import { AuthService } from './services/auth.service';
import { DatabaseService } from './services/database.service';
import { MongoTodoRepository } from './repositories/mongo-todo.repository';

const NODE_ENV = process.env.NODE_ENV || 'development';
const logger = new Logger('App');

// Initialize services - these will be cached by Node.js module system
const todoLogger = new Logger('TodoService');
const authLogger = new Logger('AuthService');
const databaseLogger = new Logger('DatabaseService');
const repositoryLogger = new Logger('MongoTodoRepository');

// Repository instance
const todoRepository = new MongoTodoRepository(repositoryLogger);

// Service instances
export const todoService = new TodoService(todoRepository, todoLogger);
export const authService = new AuthService();
export const databaseService = DatabaseService.getInstance(databaseLogger);

// Create Express app
const app = express();

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
  const frontendPath = path.join(__dirname, 'frontend');
  
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

export { app };
