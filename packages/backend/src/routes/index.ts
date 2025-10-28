import { Router } from 'express';
import { todoRoutes } from './todo.routes';

const router = Router();

// Mount route modules
router.use('/todos', todoRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export { router as apiRoutes };