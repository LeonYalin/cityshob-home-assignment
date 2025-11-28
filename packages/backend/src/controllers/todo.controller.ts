import { Request, Response, NextFunction } from 'express';
import { ServiceFactory } from '../services/service.factory';
import { NotFoundError } from '../errors';
import { Logger } from '../services/logger.service';
import { CreateTodoInput, UpdateTodoInput, TodoIdParams, TodoQueryParams } from '../schemas/todo.schema';
import { getSocketService } from '../server';
import type {
  CreateTodoResponse,
  GetTodoResponse,
  GetTodosResponse,
  UpdateTodoResponse,
  DeleteTodoResponse,
  ToggleTodoResponse,
  LockTodoResponse,
  UnlockTodoResponse,
  Todo
} from '@real-time-todo/common';
import { TodoDoc } from '../models/todo.model';

// Create a shared logger instance for the todo controller module
const logger = new Logger('TodoController');

/**
 * Convert TodoDoc to Todo type
 */
export function todoDocToTodo(doc: TodoDoc): Todo {
  const json = doc.toJSON();
  return {
    id: json.id || doc._id.toString(),
    title: json.title,
    description: json.description,
    completed: json.completed,
    priority: json.priority,
    createdBy: json.createdBy,
    createdAt: json.createdAt.toISOString(),
    updatedAt: json.updatedAt.toISOString(),
    ...(doc.lockedBy && { lockedBy: doc.lockedBy }),
    ...(doc.lockedAt && { lockedAt: doc.lockedAt.toISOString() })
  };
}

export const todoController = {
  // GET /api/todos
  getAllTodos: async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Getting all todos');
      const queryParams = req.query as unknown as TodoQueryParams;
      const userId = req.user?.userId; // From JWT middleware
      const todoService = await ServiceFactory.getTodoService();
      const todos = await todoService.getAllTodos(queryParams, userId);
      
      res.json({
        success: true,
        data: todos.map(todoDocToTodo)
      } satisfies GetTodosResponse);
    } catch (error) {
      logger.error('Error getting all todos:', error);
      next(error);
    }
  },

  // POST /api/todos
  createTodo: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const todoData = req.body as CreateTodoInput;
      const userId = req.user?.userId;
      const username = req.user?.username;
      
      if (!userId || !username) {
        throw new NotFoundError('User authentication required');
      }
      
      logger.info(`Creating todo with title: ${todoData.title} for user: ${userId}`);
      
      const todoService = await ServiceFactory.getTodoService();
      const todo = await todoService.createTodo(todoData, userId);
      
      // Broadcast socket event
      const socketService = getSocketService();
      if (socketService) {
        socketService.broadcastTodoCreated(todo, userId, username);
      }
      
      res.status(201).json({
        success: true,
        message: 'Todo created successfully',
        data: todoDocToTodo(todo)
      } satisfies CreateTodoResponse);
    } catch (error) {
      logger.error('Error creating todo:', error);
      next(error);
    }
  },

  // GET /api/todos/:id
  getTodoById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as TodoIdParams;
      logger.info(`Getting todo with id: ${id}`);
      
      const todoService = await ServiceFactory.getTodoService();
      const todo = await todoService.getTodoById(id);
      if (!todo) {
        throw new NotFoundError(`Todo with id ${id} not found`);
      }
      
      res.json({
        success: true,
        data: todoDocToTodo(todo)
      } satisfies GetTodoResponse);
    } catch (error) {
      logger.error(`Error getting todo with id ${req.params.id}:`, error);
      next(error);
    }
  },

  // PUT /api/todos/:id
  updateTodo: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as TodoIdParams;
      const updateData = req.body as UpdateTodoInput;
      const userId = req.user?.userId;
      const username = req.user?.username;
      
      logger.info(`Updating todo with id: ${id}`);
      
      const todoService = await ServiceFactory.getTodoService();
      const todo = await todoService.updateTodo(id, updateData, userId);
      if (!todo) {
        throw new NotFoundError(`Todo with id ${id} not found`);
      }
      
      // Broadcast socket event
      const socketService = getSocketService();
      if (socketService && userId && username) {
        socketService.broadcastTodoUpdated(todo, userId, username);
      }
      
      res.json({
        success: true,
        message: 'Todo updated successfully',
        data: todoDocToTodo(todo)
      } satisfies UpdateTodoResponse);
    } catch (error) {
      logger.error(`Error updating todo with id ${req.params.id}:`, error);
      next(error);
    }
  },

  // DELETE /api/todos/:id
  deleteTodo: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as TodoIdParams;
      const userId = req.user?.userId;
      const username = req.user?.username;
      
      logger.info(`Deleting todo with id: ${id}`);
      
      const todoService = await ServiceFactory.getTodoService();
      const deleted = await todoService.deleteTodo(id, userId);
      if (!deleted) {
        throw new NotFoundError(`Todo with id ${id} not found`);
      }
      
      // Broadcast socket event
      const socketService = getSocketService();
      if (socketService && userId && username) {
        socketService.broadcastTodoDeleted(id, userId, username);
      }
      
      res.status(204).send();
    } catch (error) {
      logger.error(`Error deleting todo with id ${req.params.id}:`, error);
      next(error);
    }
  },

  // PATCH /api/todos/:id/toggle
  toggleTodo: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as TodoIdParams;
      const userId = req.user?.userId;
      const username = req.user?.username;
      
      logger.info(`Toggling todo with id: ${id}`);
      
      const todoService = await ServiceFactory.getTodoService();
      const todo = await todoService.toggleTodo(id);
      if (!todo) {
        throw new NotFoundError(`Todo with id ${id} not found`);
      }
      
      // Broadcast socket event
      const socketService = getSocketService();
      if (socketService && userId && username) {
        socketService.broadcastTodoUpdated(todo, userId, username);
      }
      
      res.json({
        success: true,
        message: 'Todo toggled successfully',
        data: todoDocToTodo(todo)
      } satisfies ToggleTodoResponse);
    } catch (error) {
      logger.error(`Error toggling todo with id ${req.params.id}:`, error);
      next(error);
    }
  },

  // POST /api/todos/:id/lock
  lockTodo: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as TodoIdParams;
      const userId = req.user?.userId;
      const username = req.user?.username;
      
      if (!userId || !username) {
        throw new NotFoundError('User authentication required');
      }
      
      logger.info(`Locking todo with id: ${id} for user: ${userId}`);
      
      const todoService = await ServiceFactory.getTodoService();
      const lockedTodo = await todoService.lockTodo(id, userId);
      
      if (!lockedTodo) {
        return res.status(409).json({
          success: false,
          message: 'Todo is already locked by another user or not found'
        });
      }
      
      // Broadcast socket event
      const socketService = getSocketService();
      if (socketService) {
        socketService.broadcastTodoLocked(id, userId, username);
      }
      
      res.json({
        success: true,
        message: 'Todo locked successfully',
        data: {
          id: lockedTodo._id.toString(),
          lockedBy: userId,
          lockedAt: lockedTodo.lockedAt?.toISOString() || new Date().toISOString()
        }
      } satisfies LockTodoResponse);
    } catch (error) {
      logger.error(`Error locking todo with id ${req.params.id}:`, error);
      next(error);
    }
  },

  // POST /api/todos/:id/unlock
  unlockTodo: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as TodoIdParams;
      const userId = req.user?.userId;
      
      logger.info(`Unlocking todo with id: ${id} for user: ${userId}`);
      
      const todoService = await ServiceFactory.getTodoService();
      await todoService.unlockTodo(id, userId);
      
      // Broadcast socket event
      const socketService = getSocketService();
      if (socketService && userId) {
        socketService.broadcastTodoUnlocked(id, userId);
      }
      
      res.json({
        success: true,
        message: 'Todo unlocked successfully'
      } satisfies UnlockTodoResponse);
    } catch (error) {
      logger.error(`Error unlocking todo with id ${req.params.id}:`, error);
      next(error);
    }
  }
};