import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { validateSchema } from '../middleware/zod-validation.middleware';
import { registerSchema, loginSchema } from '../schemas/auth.schema';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validateSchema({ body: registerSchema.shape.body }), authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get JWT token
 * @access  Public
 */
router.post('/login', validateSchema({ body: loginSchema.shape.body }), authController.login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user information
 * @access  Private (requires authentication)
 */
router.get('/me', AuthMiddleware.authenticate, authController.getCurrentUser);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private (requires authentication)
 */
router.post('/logout', AuthMiddleware.authenticate, authController.logout);

export default router;