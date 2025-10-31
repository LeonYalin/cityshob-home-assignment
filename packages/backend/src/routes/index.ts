import { Router } from 'express';
import { todoRoutes } from './todo.routes';
import authRoutes from './auth.routes';

const router = Router();

// Mount route modules
router.use('/todos', todoRoutes);
router.use('/auth', authRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    service: 'Real-Time Todo API',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export { router as apiRoutes };