import jwt, { SignOptions } from 'jsonwebtoken';
import { UserDoc, UserModel } from '../models/user.model';
import { Logger } from './logger.service';
import { ValidationError } from '../errors';
import { LoginInput, RegisterInput } from '../schemas/auth.schema';
import { InMemoryUserStore, SimpleUser } from '../repositories/in-memory-user.repository';
import { databaseService } from '../app';

export interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
  };
  token: string;
}

export interface JwtPayload {
  userId: string;
  username: string;
  email: string;
  iat?: number;
  exp?: number;
}

export class AuthService {
  private readonly logger: Logger;
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor() {
    this.logger = new Logger('AuthService');
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    
    if (process.env.NODE_ENV === 'production' && this.jwtSecret === 'your-super-secret-jwt-key-change-in-production') {
      this.logger.warn('Using default JWT secret in production! Please set JWT_SECRET environment variable.');
    }
  }

  async register(registerData: RegisterInput): Promise<AuthResponse> {
    this.logger.info('Attempting user registration', { username: registerData.username, email: registerData.email });

    try {
      
      const isMongoConnected = databaseService.getConnectionStatus();

      if (isMongoConnected) {
        return await this.registerWithMongo(registerData);
      } else {
        this.logger.info('Using in-memory user storage for registration');
        return await this.registerWithMemory(registerData);
      }
    } catch (error) {
      this.logger.error('Registration failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        username: registerData.username,
        email: registerData.email
      });
      throw error;
    }
  }

  private async registerWithMongo(registerData: RegisterInput): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await UserModel.findOne({
      $or: [
        { email: registerData.email },
        { username: registerData.username }
      ]
    });

    if (existingUser) {
      if (existingUser.email === registerData.email) {
        throw new ValidationError([{ message: 'User with this email already exists', field: 'email' }]);
      }
      if (existingUser.username === registerData.username) {
        throw new ValidationError([{ message: 'Username is already taken', field: 'username' }]);
      }
    }

    // Create new user
    const user = new UserModel(registerData);
    await user.save();

    this.logger.info('User registered successfully with MongoDB', { userId: user.id, username: user.username });

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      token
    };
  }

  private async registerWithMemory(registerData: RegisterInput): Promise<AuthResponse> {
    const userStore = InMemoryUserStore.getInstance();

    // Check if user already exists
    const existingEmailUser = await userStore.findOne({ email: registerData.email });
    const existingUsernameUser = await userStore.findOne({ username: registerData.username });

    if (existingEmailUser) {
      throw new ValidationError([{ message: 'User with this email already exists', field: 'email' }]);
    }
    if (existingUsernameUser) {
      throw new ValidationError([{ message: 'Username is already taken', field: 'username' }]);
    }

    // Create new user
    const user = await userStore.create(registerData);

    this.logger.info('User registered successfully with in-memory storage', { userId: user.id, username: user.username });

    // Generate JWT token
    const token = this.generateTokenFromSimpleUser(user);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      token
    };
  }

  async login(loginData: LoginInput): Promise<AuthResponse> {
    this.logger.info('Attempting user login', { email: loginData.email });

    try {
      
      const isMongoConnected = databaseService.getConnectionStatus();

      if (isMongoConnected) {
        return await this.loginWithMongo(loginData);
      } else {
        this.logger.info('Using in-memory user storage for login');
        return await this.loginWithMemory(loginData);
      }
    } catch (error) {
      this.logger.error('Login failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        email: loginData.email
      });
      throw error;
    }
  }

  private async loginWithMongo(loginData: LoginInput): Promise<AuthResponse> {
    // Find user by email
    const user = await UserModel.findOne({ email: loginData.email }).select('+password');
    
    if (!user) {
      throw new ValidationError([{ message: 'Invalid email or password', field: 'email' }]);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(loginData.password);
    
    if (!isPasswordValid) {
      this.logger.warn('Invalid password attempt', { userId: user.id, email: loginData.email });
      throw new ValidationError([{ message: 'Invalid email or password', field: 'password' }]);
    }

    this.logger.info('User logged in successfully with MongoDB', { userId: user.id, username: user.username });

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      token
    };
  }

  private async loginWithMemory(loginData: LoginInput): Promise<AuthResponse> {
    const userStore = InMemoryUserStore.getInstance();

    // Find user by email
    const user = await userStore.findOne({ email: loginData.email });
    
    if (!user) {
      throw new ValidationError([{ message: 'Invalid email or password', field: 'email' }]);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(loginData.password);
    
    if (!isPasswordValid) {
      this.logger.warn('Invalid password attempt', { userId: user.id, email: loginData.email });
      throw new ValidationError([{ message: 'Invalid email or password', field: 'password' }]);
    }

    this.logger.info('User logged in successfully with in-memory storage', { userId: user.id, username: user.username });

    // Generate JWT token
    const token = this.generateTokenFromSimpleUser(user);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      token
    };
  }

  async getUserById(userId: string): Promise<UserDoc | SimpleUser | null> {
    this.logger.debug('Fetching user by ID', { userId });
    
    try {
      
      const isMongoConnected = databaseService.getConnectionStatus();

      if (isMongoConnected) {
        const user = await UserModel.findById(userId);
        return user;
      } else {
        const userStore = InMemoryUserStore.getInstance();
        const user = await userStore.findById(userId);
        return user;
      }
    } catch (error) {
      this.logger.error('Failed to fetch user', { userId, error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  generateToken(user: UserDoc): string {
    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      email: user.email
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: '7d' });
  }

  generateTokenFromSimpleUser(user: SimpleUser): string {
    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      email: user.email
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: '7d' });
  }

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as JwtPayload;
    } catch (error) {
      this.logger.warn('Token verification failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new ValidationError([{ message: 'Invalid or expired token', field: 'token' }]);
    }
  }
}