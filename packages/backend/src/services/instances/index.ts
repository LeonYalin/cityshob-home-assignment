/**
 * Service Instances
 * 
 * Centralized export of singleton service instances.
 * Node.js module caching ensures these are created once and shared across all imports.
 */

import { TodoService } from '../todo.service';
import { AuthService } from '../auth.service';
import { DatabaseService } from '../database.service';
import { Logger } from '../logger.service';
import { MongoTodoRepository } from '../../repositories/mongo-todo.repository';

// Logger instances
const todoLogger = new Logger('TodoService');
const authLogger = new Logger('AuthService');
const databaseLogger = new Logger('DatabaseService');

// Repository instance
const todoRepository = new MongoTodoRepository(new Logger('MongoTodoRepository'));

// Service instances - created once and cached by Node.js
export const todoService = new TodoService(todoRepository, todoLogger);
export const authService = new AuthService();
export const databaseService = DatabaseService.getInstance(databaseLogger);

// Re-export for convenience
export { DatabaseService } from '../database.service';
