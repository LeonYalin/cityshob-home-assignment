import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { SocketService } from './socket.service';
import jwt from 'jsonwebtoken';
import { socketEvents } from '@real-time-todo/common';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../services/logger.service', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));

describe('SocketService', () => {
  let mockHttpServer: HTTPServer;
  let socketService: SocketService;
  let mockIo: any;
  let mockSocket: any;

  beforeEach(() => {
    // Create mock HTTP server
    mockHttpServer = {
      on: jest.fn(),
      listen: jest.fn(),
    } as any;

    // Create mock Socket.IO instance
    mockIo = {
      use: jest.fn(),
      on: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
    };

    // Create mock socket
    mockSocket = {
      id: 'test-socket-id',
      handshake: {
        auth: {},
        headers: {},
      },
      on: jest.fn(),
      emit: jest.fn(),
      broadcast: {
        emit: jest.fn(),
      },
      join: jest.fn(),
      leave: jest.fn(),
      user: null,
    };

    // Mock Socket.IO Server constructor
    jest.spyOn(require('socket.io'), 'Server').mockImplementation(() => mockIo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize Socket.IO service with correct configuration', () => {
      socketService = new SocketService(mockHttpServer);

      expect(mockIo.use).toHaveBeenCalled(); // Middleware setup
      expect(mockIo.on).toHaveBeenCalledWith(socketEvents.connection, expect.any(Function));
    });

    it('should setup CORS with credentials', () => {
      const ServerConstructor = require('socket.io').Server;
      socketService = new SocketService(mockHttpServer);

      expect(ServerConstructor).toHaveBeenCalledWith(
        mockHttpServer,
        expect.objectContaining({
          cors: {
            origin: true,
            credentials: true,
          },
        })
      );
    });
  });

  describe('Authentication Middleware', () => {
    beforeEach(() => {
      socketService = new SocketService(mockHttpServer);
    });

    it('should authenticate socket with valid token from auth', async () => {
      const mockNext = jest.fn();
      const mockDecoded = {
        userId: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      };

      mockSocket.handshake.auth.token = 'valid-token';
      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      // Get the middleware function
      const middleware = mockIo.use.mock.calls[0][0];
      await middleware(mockSocket, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String));
      expect(mockSocket.user).toEqual(mockDecoded);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should authenticate socket with valid token from cookies', async () => {
      const mockNext = jest.fn();
      const mockDecoded = {
        userId: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      };

      mockSocket.handshake.headers.cookie = 'auth_token=valid-token; other=value';
      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      const middleware = mockIo.use.mock.calls[0][0];
      await middleware(mockSocket, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String));
      expect(mockSocket.user).toEqual(mockDecoded);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject socket without authentication token', async () => {
      const mockNext = jest.fn();

      const middleware = mockIo.use.mock.calls[0][0];
      await middleware(mockSocket, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext.mock.calls[0][0].message).toBe('Authentication token not provided');
    });

    it('should reject socket with invalid token', async () => {
      const mockNext = jest.fn();
      mockSocket.handshake.auth.token = 'invalid-token';
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const middleware = mockIo.use.mock.calls[0][0];
      await middleware(mockSocket, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext.mock.calls[0][0].message).toBe('Authentication failed');
    });
  });

  describe('extractTokenFromCookies', () => {
    beforeEach(() => {
      socketService = new SocketService(mockHttpServer);
    });

    it('should extract auth_token from cookie string', () => {
      const cookieString = 'auth_token=test-token; other_cookie=value';
      const result = (socketService as any).extractTokenFromCookies(cookieString);
      
      expect(result).toBe('test-token');
    });

    it('should return null if cookie string is undefined', () => {
      const result = (socketService as any).extractTokenFromCookies(undefined);
      
      expect(result).toBeNull();
    });

    it('should return null if auth_token is not present', () => {
      const cookieString = 'other_cookie=value; another=test';
      const result = (socketService as any).extractTokenFromCookies(cookieString);
      
      expect(result).toBeNull();
    });

    it('should handle cookies with spaces', () => {
      const cookieString = ' auth_token = test-token ; other = value ';
      const result = (socketService as any).extractTokenFromCookies(cookieString);
      
      expect(result).toBe('test-token');
    });
  });

  describe('broadcastTodoCreated', () => {
    let mockTodoDoc: any;

    beforeEach(() => {
      socketService = new SocketService(mockHttpServer);
      mockTodoDoc = {
        _id: 'todo-123',
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
        priority: 'high',
        createdBy: 'user-123',
        toJSON: () => ({
          id: 'todo-123',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          priority: 'high',
          createdBy: 'user-123',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
        }),
      };
    });

    it('should broadcast todo created event', () => {
      socketService.broadcastTodoCreated(mockTodoDoc, 'user-123', 'testuser');

      expect(mockIo.emit).toHaveBeenCalledWith(
        socketEvents.todoCreated,
        expect.objectContaining({
          todo: mockTodoDoc,
          userId: 'user-123',
          username: 'testuser',
        })
      );
    });
  });

  describe('broadcastTodoUpdated', () => {
    let mockTodoDoc: any;

    beforeEach(() => {
      socketService = new SocketService(mockHttpServer);
      mockTodoDoc = {
        _id: 'todo-123',
        title: 'Updated Todo',
        toJSON: () => ({
          id: 'todo-123',
          title: 'Updated Todo',
        }),
      };
    });

    it('should broadcast todo updated event', () => {
      socketService.broadcastTodoUpdated(mockTodoDoc, 'user-123', 'testuser');

      expect(mockIo.emit).toHaveBeenCalledWith(
        socketEvents.todoUpdated,
        expect.objectContaining({
          todo: mockTodoDoc,
          userId: 'user-123',
          username: 'testuser',
        })
      );
    });
  });

  describe('broadcastTodoDeleted', () => {
    beforeEach(() => {
      socketService = new SocketService(mockHttpServer);
    });

    it('should broadcast todo deleted event', () => {
      socketService.broadcastTodoDeleted('todo-123', 'user-123', 'testuser');

      expect(mockIo.emit).toHaveBeenCalledWith(
        socketEvents.todoDeleted,
        expect.objectContaining({
          todoId: 'todo-123',
          userId: 'user-123',
          username: 'testuser',
        })
      );
    });
  });

  describe('broadcastTodoLocked', () => {
    beforeEach(() => {
      socketService = new SocketService(mockHttpServer);
    });

    it('should broadcast todo locked event', () => {
      socketService.broadcastTodoLocked('todo-123', 'user-123', 'testuser');

      expect(mockIo.emit).toHaveBeenCalledWith(
        socketEvents.todoLocked,
        expect.objectContaining({
          todoId: 'todo-123',
          userId: 'user-123',
          username: 'testuser',
        })
      );
    });
  });

  describe('broadcastTodoUnlocked', () => {
    beforeEach(() => {
      socketService = new SocketService(mockHttpServer);
    });

    it('should broadcast todo unlocked event', () => {
      socketService.broadcastTodoUnlocked('todo-123', 'user-123');

      expect(mockIo.emit).toHaveBeenCalledWith(
        socketEvents.todoUnlocked,
        expect.objectContaining({
          todoId: 'todo-123',
          userId: 'user-123',
        })
      );
    });
  });

  describe('Common Package Integration', () => {
    it('should use socketEvents from common package', () => {
      expect(socketEvents).toBeDefined();
      expect(socketEvents.connection).toBe('connection');
      expect(socketEvents.todoCreated).toBe('todo:created');
      expect(socketEvents.todoUpdated).toBe('todo:updated');
      expect(socketEvents.todoDeleted).toBe('todo:deleted');
      expect(socketEvents.todoLocked).toBe('todo:locked');
      expect(socketEvents.todoUnlocked).toBe('todo:unlocked');
    });

    it('should use camelCase event names from common package', () => {
      expect(socketEvents.userConnected).toBe('user:connected');
      expect(socketEvents.userDisconnected).toBe('user:disconnected');
      expect(socketEvents.requestUsersList).toBe('request:users:list');
      expect(socketEvents.usersList).toBe('users:list');
    });
  });
});
