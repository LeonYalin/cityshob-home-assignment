import { Request, Response, NextFunction } from 'express';
import { authService } from '../app';
import { LoginInput, RegisterInput } from '../schemas/auth.schema';
import { ValidationError } from '../errors';
import appConfig from '../config/app.config';
import type { 
  RegisterResponse, 
  LoginResponse, 
  GetCurrentUserResponse, 
  LogoutResponse 
} from '@real-time-todo/common';

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
      
      // Set HTTP-only cookie with the JWT token
      res.cookie('auth_token', result.token, {
        httpOnly: true,
        secure: appConfig.cookieSecure,
        sameSite: appConfig.cookieSameSite,
        maxAge: appConfig.cookieMaxAge,
        path: '/'
      });
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: result.user.id,
            username: result.user.username,
            email: result.user.email,
            createdAt: result.user.createdAt.toISOString(),
            updatedAt: result.user.updatedAt.toISOString()
          }
          // Don't send token in response body for security
        }
      } satisfies RegisterResponse);
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
      
      // Set HTTP-only cookie with the JWT token
      res.cookie('auth_token', result.token, {
        httpOnly: true,
        secure: appConfig.cookieSecure,
        sameSite: appConfig.cookieSameSite,
        maxAge: appConfig.cookieMaxAge,
        path: '/'
      });
      
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: result.user.id,
            username: result.user.username,
            email: result.user.email,
            createdAt: result.user.createdAt.toISOString(),
            updatedAt: result.user.updatedAt.toISOString()
          }
          // Don't send token in response body for security
        }
      } satisfies LoginResponse);
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
        message: 'User retrieved successfully',
        data: {
          user: {
            id: '_id' in user ? user._id.toString() : user.id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString()
          }
        }
      } satisfies GetCurrentUserResponse);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/logout
   * Logout user by clearing the authentication cookie
   */
  logout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Clear the authentication cookie
      res.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
      
      res.json({
        success: true,
        message: 'Logout successful'
      } satisfies LogoutResponse);
    } catch (error) {
      next(error);
    }
  }
};