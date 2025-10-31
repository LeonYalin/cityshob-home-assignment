import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { LoginInput, RegisterInput } from '../schemas/auth.schema';
import { ValidationError } from '../errors';

const authService = new AuthService();

export const authController = {
  /**
   * POST /api/auth/register
   * Register a new user
   */
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const registerData: RegisterInput = req.body;

      // Basic validation
      if (!registerData.username || !registerData.email || !registerData.password) {
        throw new ValidationError([
          { message: 'Username, email, and password are required' }
        ]);
      }

      const result = await authService.register(registerData);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/login
   * Login user and return JWT token
   */
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const loginData: LoginInput = req.body;

      // Basic validation
      if (!loginData.email || !loginData.password) {
        throw new ValidationError([
          { message: 'Email and password are required' }
        ]);
      }

      const result = await authService.login(loginData);
      
      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/auth/me
   * Get current user information (requires authentication)
   */
  getCurrentUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ValidationError([{ message: 'User not authenticated' }]);
      }

      const user = await authService.getUserById(req.user.userId);
      
      if (!user) {
        throw new ValidationError([{ message: 'User not found' }]);
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/logout
   * Logout user (client-side token removal)
   */
  logout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // For JWT, logout is handled client-side by removing the token
      // Server can optionally maintain a blacklist of tokens
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  }
};