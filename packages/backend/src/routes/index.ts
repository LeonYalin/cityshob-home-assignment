import { Router } from 'express';
import { todoRoutes } from './todo.routes';
import authRoutes from './auth.routes';
import appConfig from '../config/app.config';

const router = Router();

// Mount route modules
router.use('/todos', todoRoutes);
router.use('/auth', authRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    service: 'Real-Time Todo API',
    environment: appConfig.nodeEnv,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export { router as apiRoutes };