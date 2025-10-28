import { Request, Response, NextFunction } from 'express';
import { ServiceFactory } from '../services/service.factory';
import { NotFoundError } from '../errors';
import { Logger } from '../services/logger.service';
import { CreateTodoInput, UpdateTodoInput, TodoIdParams, TodoQueryParams } from '../schemas/todo.schema';

// Create a shared logger instance for the todo controller module
const logger = new Logger('TodoController');

export const todoController = {
  // GET /api/todos
  getAllTodos: async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Getting all todos');
      const queryParams = req.query as unknown as TodoQueryParams;
      const todoService = await ServiceFactory.getTodoService();
      const todos = await todoService.getAllTodos(queryParams);
      res.json(todos);
    } catch (error) {
      logger.error('Error getting all todos:', error);
      next(error);
    }
  },

  // POST /api/todos
  createTodo: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const todoData = req.body as CreateTodoInput;
      logger.info(`Creating todo with title: ${todoData.title}`);
      
      const todoService = await ServiceFactory.getTodoService();
      const todo = await todoService.createTodo(todoData);
      
      res.status(201).json(todo);
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
      
      res.json(todo);
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
      logger.info(`Updating todo with id: ${id}`);
      
      const todoService = await ServiceFactory.getTodoService();
      const todo = await todoService.updateTodo(id, updateData);
      if (!todo) {
        throw new NotFoundError(`Todo with id ${id} not found`);
      }
      
      res.json(todo);
    } catch (error) {
      logger.error(`Error updating todo with id ${req.params.id}:`, error);
      next(error);
    }
  },

  // DELETE /api/todos/:id
  deleteTodo: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as TodoIdParams;
      logger.info(`Deleting todo with id: ${id}`);
      
      const todoService = await ServiceFactory.getTodoService();
      const deleted = await todoService.deleteTodo(id);
      if (!deleted) {
        throw new NotFoundError(`Todo with id ${id} not found`);
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
      logger.info(`Toggling todo with id: ${id}`);
      
      const todoService = await ServiceFactory.getTodoService();
      const todo = await todoService.toggleTodo(id);
      if (!todo) {
        throw new NotFoundError(`Todo with id ${id} not found`);
      }
      
      res.json(todo);
    } catch (error) {
      logger.error(`Error toggling todo with id ${req.params.id}:`, error);
      next(error);
    }
  }
};