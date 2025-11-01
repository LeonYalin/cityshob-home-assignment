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
   * Reads JWT token from HTTP-only cookie for security
   */
  static authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get token from HTTP-only cookie
      const token = req.cookies?.auth_token;
      
      if (!token) {
        throw new ValidationError([{ message: 'Authentication required', field: 'auth_token' }]);
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
      const token = req.cookies?.auth_token;
      
      if (token) {
        try {
          const userPayload = AuthMiddleware.authService.verifyToken(token);
          req.user = userPayload;
        } catch (error) {
          // Ignore token verification errors in optional auth
          // Just proceed without user
        }
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}