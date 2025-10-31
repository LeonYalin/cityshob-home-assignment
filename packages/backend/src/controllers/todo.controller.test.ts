import request from 'supertest';
import express from 'express';
import { todoController } from './todo.controller';
import { ServiceFactory } from '../services/service.factory';
import { NotFoundError } from '../errors';
import { CreateTodoInput, UpdateTodoInput } from '../schemas/todo.schema';

// Mock the ServiceFactory
jest.mock('../services/service.factory');
const mockServiceFactory = ServiceFactory as jest.Mocked<typeof ServiceFactory>;

// Mock Logger
jest.mock('../services/logger.service', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));

describe('TodoController', () => {
  let app: express.Application;
  let mockTodoService: any;

  beforeEach(() => {
    // Create Express app for testing
    app = express();
    app.use(express.json());

    // Mock authentication middleware - add user to request
    app.use((req: any, res, next) => {
      req.user = { userId: 'test-user-123', username: 'testuser', email: 'test@example.com' };
      next();
    });

    // Create mock service
    mockTodoService = {
      getAllTodos: jest.fn(),
      getTodoById: jest.fn(),
      createTodo: jest.fn(),
      updateTodo: jest.fn(),
      deleteTodo: jest.fn(),
      toggleTodo: jest.fn(),
    };

    // Mock ServiceFactory to return our mock service
    mockServiceFactory.getTodoService.mockResolvedValue(mockTodoService);

    // Set up routes
    app.get('/todos', todoController.getAllTodos);
    app.post('/todos', todoController.createTodo);
    app.get('/todos/:id', todoController.getTodoById);
    app.put('/todos/:id', todoController.updateTodo);
    app.delete('/todos/:id', todoController.deleteTodo);
    app.patch('/todos/:id/toggle', todoController.toggleTodo);

    // Error handling middleware
    app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /todos', () => {
    it('should return all todos successfully', async () => {
      // Arrange
      const mockTodos = [
        { id: '1', title: 'Test Todo 1', completed: false, priority: 'high' },
        { id: '2', title: 'Test Todo 2', completed: true, priority: 'medium' },
      ];
      mockTodoService.getAllTodos.mockResolvedValue(mockTodos);

      // Act & Assert
      const response = await request(app)
        .get('/todos')
        .query({ completed: 'true', priority: 'high', limit: '10', page: '1' })
        .expect(200);

      expect(response.body).toEqual(mockTodos);
      expect(mockTodoService.getAllTodos).toHaveBeenCalledWith({
        completed: 'true',
        priority: 'high',
        limit: '10',
        page: '1'
      }, 'test-user-123');
    });

    it('should handle service errors', async () => {
      // Arrange
      mockTodoService.getAllTodos.mockRejectedValue(new Error('Service error'));

      // Act & Assert
      await request(app)
        .get('/todos')
        .expect(500);
    });
  });

  describe('POST /todos', () => {
    it('should create a new todo successfully', async () => {
      // Arrange
      const createTodoData: CreateTodoInput = {
        title: 'New Todo',
        description: 'Test description',
        priority: 'high',
      };
      const createdTodo = {
        id: '123',
        ...createTodoData,
        completed: false,
      };
      
      mockTodoService.createTodo.mockResolvedValue(createdTodo);

      // Act & Assert
      const response = await request(app)
        .post('/todos')
        .send(createTodoData)
        .expect(201);

      expect(response.body).toEqual(createdTodo);
      expect(mockTodoService.createTodo).toHaveBeenCalledWith(createTodoData, 'test-user-123');
    });

    it('should handle validation errors', async () => {
      // Arrange
      mockTodoService.createTodo.mockRejectedValue(new Error('Validation failed'));

      // Act & Assert
      await request(app)
        .post('/todos')
        .send({ title: '' }) // Invalid data
        .expect(500);
    });
  });

  describe('GET /todos/:id', () => {
    it('should return a todo by id successfully', async () => {
      // Arrange
      const todoId = '123';
      const mockTodo = {
        id: todoId,
        title: 'Test Todo',
        description: 'Test description',
        completed: false,
        priority: 'medium' as const,
      };
      
      mockTodoService.getTodoById.mockResolvedValue(mockTodo);

      // Act & Assert
      const response = await request(app)
        .get(`/todos/${todoId}`)
        .expect(200);

      expect(response.body).toEqual(mockTodo);
      expect(mockTodoService.getTodoById).toHaveBeenCalledWith(todoId);
    });

    it('should handle not found errors', async () => {
      // Arrange
      const todoId = 'nonexistent';
      mockTodoService.getTodoById.mockRejectedValue(new NotFoundError('Todo not found'));

      // Act & Assert
      const response = await request(app)
        .get(`/todos/${todoId}`)
        .expect(404);

      expect(response.body).toEqual({ error: 'Todo not found' });
    });
  });

  describe('PUT /todos/:id', () => {
    it('should update a todo successfully', async () => {
      // Arrange
      const todoId = '123';
      const updateData: UpdateTodoInput = {
        title: 'Updated Todo',
        description: 'Updated description',
        priority: 'low',
      };
      const updatedTodo = {
        id: todoId,
        ...updateData,
        completed: false,
      };
      
      mockTodoService.updateTodo.mockResolvedValue(updatedTodo);

      // Act & Assert
      const response = await request(app)
        .put(`/todos/${todoId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(updatedTodo);
      expect(mockTodoService.updateTodo).toHaveBeenCalledWith(todoId, updateData);
    });

    it('should handle update errors', async () => {
      // Arrange
      const todoId = '123';
      mockTodoService.updateTodo.mockRejectedValue(new NotFoundError('Todo not found'));

      // Act & Assert
      const response = await request(app)
        .put(`/todos/${todoId}`)
        .send({ title: 'Updated' })
        .expect(404);

      expect(response.body).toEqual({ error: 'Todo not found' });
    });
  });

  describe('DELETE /todos/:id', () => {
    it('should delete a todo successfully', async () => {
      // Arrange
      const todoId = '123';
      mockTodoService.deleteTodo.mockResolvedValue(true);

      // Act & Assert
      await request(app)
        .delete(`/todos/${todoId}`)
        .expect(204);

      expect(mockTodoService.deleteTodo).toHaveBeenCalledWith(todoId);
    });

    it('should handle delete failures', async () => {
      // Arrange
      const todoId = 'nonexistent';
      mockTodoService.deleteTodo.mockRejectedValue(new NotFoundError('Todo not found'));

      // Act & Assert
      const response = await request(app)
        .delete(`/todos/${todoId}`)
        .expect(404);

      expect(response.body).toEqual({ error: 'Todo not found' });
    });
  });

  describe('PATCH /todos/:id/toggle', () => {
    it('should toggle todo completion successfully', async () => {
      // Arrange
      const todoId = '123';
      const toggledTodo = {
        id: todoId,
        title: 'Test Todo',
        completed: true,
        priority: 'medium' as const,
      };
      
      mockTodoService.toggleTodo.mockResolvedValue(toggledTodo);

      // Act & Assert
      const response = await request(app)
        .patch(`/todos/${todoId}/toggle`)
        .expect(200);

      expect(response.body).toEqual(toggledTodo);
      expect(mockTodoService.toggleTodo).toHaveBeenCalledWith(todoId);
    });

    it('should handle toggle errors', async () => {
      // Arrange
      const todoId = 'nonexistent';
      mockTodoService.toggleTodo.mockRejectedValue(new NotFoundError('Todo not found'));

      // Act & Assert
      const response = await request(app)
        .patch(`/todos/${todoId}/toggle`)
        .expect(404);

      expect(response.body).toEqual({ error: 'Todo not found' });
    });
  });
});