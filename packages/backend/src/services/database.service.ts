import mongoose from 'mongoose';
import { Logger } from './logger.service';
import appConfig from '../config/app.config';
import { DatabaseConnectionError } from '../errors';

export class DatabaseService {
  private static instance: DatabaseService;
  private isConnected = false;

  private constructor(private readonly logger: Logger) {}

  static getInstance(logger?: Logger): DatabaseService {
    if (!this.instance) {
      const loggerInstance = logger || new Logger('DatabaseService');
      this.instance = new DatabaseService(loggerInstance);
    }
    return this.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      this.logger.info('Database already connected');
      return;
    }

    try {
      const mongoUri = process.env.MONGODB_URI;
      
      if (!mongoUri) {
        this.logger.warn('MONGODB_URI environment variable is not set - running in fallback mode');
        return;
      }

      // MongoDB connection options
      const options = {
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      };

      this.logger.info('Connecting to MongoDB...');
      
      await mongoose.connect(mongoUri, options);
      
      this.isConnected = true;
      this.logger.info('✅ Successfully connected to MongoDB');

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        this.logger.error('MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        this.logger.warn('MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        this.logger.info('MongoDB reconnected');
        this.isConnected = true;
      });

    } catch (error) {
      this.logger.warn('MongoDB connection failed - running in fallback mode:', error);
      // Don't throw error, just log warning and continue without MongoDB
      // This allows development without requiring MongoDB setup
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      this.logger.info('Database already disconnected');
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      this.logger.info('✅ Successfully disconnected from MongoDB');
    } catch (error) {
      this.logger.error('Error disconnecting from MongoDB:', error);
      throw new DatabaseConnectionError(
        `Failed to disconnect from database: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  async ping(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }
      
      await mongoose.connection.db.admin().ping();
      return true;
    } catch (error) {
      this.logger.error('Database ping failed:', error);
      return false;
    }
  }
}

// Export singleton instance using the factory method
export const databaseService = DatabaseService.getInstance();