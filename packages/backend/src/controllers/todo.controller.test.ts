import request from 'supertest';
import express from 'express';
import { todoController, todoDocToTodo } from './todo.controller';
import { NotFoundError } from '../errors';
import { CreateTodoInput, UpdateTodoInput } from '../schemas/todo.schema';

// Mock the server module to prevent circular dependency
jest.mock('../server', () => ({
  getSocketService: jest.fn().mockReturnValue(null),
}));

// Mock the todoService from app
jest.mock('../app', () => ({
  todoService: {
    getAllTodos: jest.fn(),
    getTodoById: jest.fn(),
    createTodo: jest.fn(),
    updateTodo: jest.fn(),
    deleteTodo: jest.fn(),
    lockTodo: jest.fn(),
    unlockTodo: jest.fn(),
    toggleTodo: jest.fn(),
  }
}));

// Mock Logger
jest.mock('../services/logger.service', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));

// Helper to create mock TodoDoc with proper structure
function createMockTodoDoc(data: any): any {
  const now = new Date();
  return {
    ...data,
    _id: data.id,
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
    createdBy: data.createdBy || 'test-user-123',
    toJSON: () => ({
      id: data.id,
      title: data.title,
      description: data.description || '',
      completed: data.completed || false,
      priority: data.priority || 'medium',
      createdBy: data.createdBy || 'test-user-123',
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    }),
  };
}

describe('TodoController', () => {
  let app: express.Application;
  let mockTodoService: any;

  beforeEach(() => {
    // Get the mocked todoService
    const { todoService } = require('../app');
    mockTodoService = todoService;

    // Reset all mocks
    jest.clearAllMocks();

    // Create Express app for testing
    app = express();
    app.use(express.json());

    // Mock authentication middleware - add user to request
    app.use((req: any, res, next) => {
      req.user = { userId: 'test-user-123', username: 'testuser', email: 'test@example.com' };
      next();
    });

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
      const mockTodoDocs = [
        createMockTodoDoc({ id: '1', title: 'Test Todo 1', completed: false, priority: 'high' }),
        createMockTodoDoc({ id: '2', title: 'Test Todo 2', completed: true, priority: 'medium' }),
      ];
      mockTodoService.getAllTodos.mockResolvedValue(mockTodoDocs);

      // Act & Assert
      const response = await request(app)
        .get('/todos')
        .query({ completed: 'true', priority: 'high', limit: '10', page: '1' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.data[0].id).toBe('1');
      expect(response.body.data.data[1].id).toBe('2');
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
      const createdTodoDoc = createMockTodoDoc({
        id: '123',
        ...createTodoData,
        completed: false,
      });
      
      mockTodoService.createTodo.mockResolvedValue(createdTodoDoc);

      // Act & Assert
      const response = await request(app)
        .post('/todos')
        .send(createTodoData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Todo created successfully');
      expect(response.body.data.id).toBe('123');
      expect(response.body.data.title).toBe('New Todo');
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
      const mockTodoDoc = createMockTodoDoc({
        id: todoId,
        title: 'Test Todo',
        description: 'Test description',
        completed: false,
        priority: 'medium',
      });
      
      mockTodoService.getTodoById.mockResolvedValue(mockTodoDoc);

      // Act & Assert
      const response = await request(app)
        .get(`/todos/${todoId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(todoId);
      expect(response.body.data.title).toBe('Test Todo');
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
      const updatedTodoDoc = createMockTodoDoc({
        id: todoId,
        ...updateData,
        completed: false,
      });
      
      mockTodoService.updateTodo.mockResolvedValue(updatedTodoDoc);

      // Act & Assert
      const response = await request(app)
        .put(`/todos/${todoId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Todo updated successfully');
      expect(response.body.data.id).toBe(todoId);
      expect(mockTodoService.updateTodo).toHaveBeenCalledWith(todoId, updateData, 'test-user-123');
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

      expect(mockTodoService.deleteTodo).toHaveBeenCalledWith(todoId, 'test-user-123');
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
      const toggledTodoDoc = createMockTodoDoc({
        id: todoId,
        title: 'Test Todo',
        completed: true,
        priority: 'medium',
      });
      
      mockTodoService.toggleTodo.mockResolvedValue(toggledTodoDoc);

      // Act & Assert
      const response = await request(app)
        .patch(`/todos/${todoId}/toggle`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Todo toggled successfully');
      expect(response.body.data.id).toBe(todoId);
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

  describe('todoDocToTodo Helper', () => {
    it('should convert TodoDoc to Todo correctly', () => {
      // Arrange
      const todoDoc = createMockTodoDoc({
        id: 'test-id-123',
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
        priority: 'high',
        createdBy: 'user-456',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      });

      // Act
      const result = todoDocToTodo(todoDoc);

      // Assert
      expect(result).toEqual({
        id: 'test-id-123',
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
        priority: 'high',
        createdBy: 'user-456',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      });
    });

    it('should handle missing optional fields', () => {
      // Arrange
      const todoDoc = createMockTodoDoc({
        id: 'test-id-456',
        title: 'Minimal Todo',
        description: undefined, // Will be converted to '' by mock
        completed: false,
        priority: 'low',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      // Act
      const result = todoDocToTodo(todoDoc);

      // Assert
      expect(result).toEqual({
        id: 'test-id-456',
        title: 'Minimal Todo',
        description: '', // Mock converts undefined to empty string
        completed: false,
        priority: 'low',
        createdBy: 'test-user-123', // Default from mock
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
    });

    it('should convert Date objects to ISO strings', () => {
      // Arrange
      const createdAt = new Date('2024-06-15T10:30:00.500Z');
      const updatedAt = new Date('2024-06-16T14:45:30.750Z');
      
      const todoDoc = createMockTodoDoc({
        id: 'date-test',
        title: 'Date Test',
        completed: true,
        priority: 'medium',
        createdAt,
        updatedAt,
      });

      // Act
      const result = todoDocToTodo(todoDoc);

      // Assert
      expect(result.createdAt).toBe('2024-06-15T10:30:00.500Z');
      expect(result.updatedAt).toBe('2024-06-16T14:45:30.750Z');
      expect(typeof result.createdAt).toBe('string');
      expect(typeof result.updatedAt).toBe('string');
    });
  });
});