import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
}));
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.SOCKET_ORIGIN_WHITELIST?.split(',') || ['http://localhost:4200'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Real-Time Todo API',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/api/hello', (req, res) => {
  res.json({
    message: 'Hello World from TypeScript Express! 👋',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

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
        hello: '/api/hello',
      },
      frontend: 'http://localhost:4200',
      timestamp: new Date().toISOString(),
    });
  });
}

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method,
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Environment: ${NODE_ENV}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`👋 Hello endpoint: http://localhost:${PORT}/api/hello`);
  
  if (NODE_ENV === 'production') {
    console.log(`🌐 Serving Angular frontend from /dist`);
  } else {
    console.log(`🔧 Frontend dev server: http://localhost:4200`);
  }
});

export default app;