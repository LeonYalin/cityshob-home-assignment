import { Request, Response, NextFunction } from 'express';
import { AuthService, JwtPayload } from '../services/auth.service';
import { ValidationError } from '../errors';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export class AuthMiddleware {
  private static authService = new AuthService();

  /**
   * Middleware to verify JWT token and add user to request
   * Requires Authorization header with Bearer token
   */
  static authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ValidationError([{ message: 'Access token is required', field: 'authorization' }]);
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      if (!token) {
        throw new ValidationError([{ message: 'Access token is required', field: 'authorization' }]);
      }

      // Verify token and get user payload
      const userPayload = AuthMiddleware.authService.verifyToken(token);
      
      // Add user to request object
      req.user = userPayload;
      
      next();
    } catch (error) {
      next(error);
    }
  };

  /**
   * Optional authentication middleware - adds user to request if token is present
   * Does not fail if no token is provided
   */
  static optionalAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        if (token) {
          try {
            const userPayload = AuthMiddleware.authService.verifyToken(token);
            req.user = userPayload;
          } catch (error) {
            // Ignore token verification errors in optional auth
            // Just proceed without user
          }
        }
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}