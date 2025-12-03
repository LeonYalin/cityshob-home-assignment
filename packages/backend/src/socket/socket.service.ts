import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { Logger } from '../services/logger.service';
import { type ConnectedUser, socketEvents } from '@real-time-todo/common';
import { TodoDoc } from '../models/todo.model';
import { todoService } from '../app';
import { config } from '../config/env.config';

const logger = new Logger('SocketService');

export class SocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, ConnectedUser> = new Map();
  private userSocketMap: Map<string, string> = new Map(); // userId -> socketId

  constructor(httpServer: HTTPServer) {
    
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: true,
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    
    logger.info('Socket.IO service initialized');
  }

  /**
   * Setup authentication middleware for Socket.IO
   */
  private setupMiddleware(): void {
    this.io.use(async (socket: Socket, next) => {
      try {
        // Get token from handshake auth or cookies
        const token = socket.handshake.auth.token || 
                     this.extractTokenFromCookies(socket.handshake.headers.cookie);

        if (!token) {
          return next(new Error('Authentication token not provided'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, config.jwtSecret) as ConnectedUser;
        
        // Attach user info to socket
        (socket as any).user = {
          userId: decoded.userId,
          username: decoded.username,
          email: decoded.email
        };

        logger.info(`Socket authenticated for user: ${decoded.username}`);
        next();
      } catch (error) {
        logger.error('Socket authentication failed:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Extract JWT token from cookie string
   */
  private extractTokenFromCookies(cookieString?: string): string | null {
    if (!cookieString) return null;
    
    const cookies = cookieString.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.split('=').map(s => s.trim());
      if (key && value) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    return cookies['auth_token'] || null;
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    this.io.on(socketEvents.connection, (socket: Socket) => {
      const user = (socket as any).user as ConnectedUser;
      
      logger.info(`User connected: ${user.username} (${socket.id})`);

      // Add user to online users
      this.handleUserConnected(socket, user);

      // Handle user requesting online users list
      socket.on(socketEvents.requestUsersList, () => {
        this.sendUsersList(socket);
      });

      // Handle disconnection
      socket.on(socketEvents.disconnect, () => {
        this.handleUserDisconnected(socket, user);
      });

      // Send initial users list to the newly connected user
      this.sendUsersList(socket);
    });
  }

  /**
   * Handle user connected event
   */
  private handleUserConnected(socket: Socket, user: ConnectedUser): void {
    const connectedUser: ConnectedUser = {
      userId: user.userId,
      username: user.username,
      email: user.email,
      socketId: socket.id,
      connectedAt: new Date().toISOString()
    };

    this.connectedUsers.set(socket.id, connectedUser);
    this.userSocketMap.set(user.userId, socket.id);

    // Broadcast to all other users that a new user connected
    socket.broadcast.emit(socketEvents.userConnected, {
      userId: user.userId,
      username: user.username,
      connectedAt: connectedUser.connectedAt
    });

    logger.info(`Connected users count: ${this.connectedUsers.size}`);
  }

  /**
   * Handle user disconnected event
   */
  private async handleUserDisconnected(socket: Socket, user: ConnectedUser): Promise<void> {
    logger.info(`User disconnected: ${user.username} (${socket.id})`);

    try {
      // Remove user from connected users
      this.connectedUsers.delete(socket.id);
      this.userSocketMap.delete(user.userId);

    // Check if user has any other active connections
    const hasOtherConnections = Array.from(this.connectedUsers.values()).some(
      connectedUser => connectedUser.userId === user.userId
    );

    // Only broadcast disconnect and cleanup if this was the user's last connection
    if (!hasOtherConnections) {
      // Unlock all todos locked by this user
      try {
        logger.info(`Cleaning up locks for user: ${user.username}`);
        
        // Find all todos locked by this user and unlock them
        const allTodos = await todoService.getAllTodos({ limit: 1000, page: 1 }, user.userId);
        const lockedByUser = allTodos.filter(todo => todo.lockedBy === user.userId);
        
        // Unlock each todo
        for (const todo of lockedByUser) {
          try {
            await todoService.unlockTodo(todo.id, user.userId);
            logger.info(`Unlocked todo ${todo.id} for disconnected user ${user.username}`);
          } catch (unlockError) {
            logger.error(`Failed to unlock todo ${todo.id}:`, unlockError);
          }
        }
      } catch (error) {
        logger.error('Error cleaning up user locks:', error);
      }

      // Broadcast to all users that user disconnected
      this.io.emit(socketEvents.userDisconnected, {
        userId: user.userId,
        username: user.username
      });
      
      logger.info(`User ${user.username} fully disconnected (no more active connections)`);
    } else {
      logger.info(`User ${user.username} still has other active connections`);
    }

    logger.info(`Connected users count: ${this.connectedUsers.size}`);
    } finally {
      // Always ensure maps are cleaned up, even if errors occurred
      this.connectedUsers.delete(socket.id);
      this.userSocketMap.delete(user.userId);
    }
  }

  /**
   * Send users list to a specific socket
   */
  private sendUsersList(socket: Socket): void {
    // Get all connected users
    const allUsers = Array.from(this.connectedUsers.values());
    
    // Deduplicate by userId - keep only the first connection for each user
    const uniqueUsersMap = new Map<string, ConnectedUser>();
    allUsers.forEach(user => {
      if (!uniqueUsersMap.has(user.userId)) {
        uniqueUsersMap.set(user.userId, user);
      }
    });
    
    // Convert to array for sending
    const usersList = Array.from(uniqueUsersMap.values()).map(user => ({
      userId: user.userId,
      username: user.username,
      connectedAt: user.connectedAt
    }));

    socket.emit(socketEvents.usersList, usersList);
  }

  /**
   * Broadcast todo created event
   */
  public broadcastTodoCreated(todo: TodoDoc, userId: string, username: string): void {
    this.io.emit(socketEvents.todoCreated, {
      todo,
      userId,
      username,
      timestamp: new Date()
    });
    logger.info(`Broadcasted todo:created event for todo: ${todo.id}`);
  }

  /**
   * Broadcast todo updated event
   */
  public broadcastTodoUpdated(todo: TodoDoc, userId: string, username: string): void {
    this.io.emit(socketEvents.todoUpdated, {
      todo,
      userId,
      username,
      timestamp: new Date()
    });
    logger.info(`Broadcasted todo:updated event for todo: ${todo.id}`);
  }

  /**
   * Broadcast todo deleted event
   */
  public broadcastTodoDeleted(todoId: string, userId: string, username: string): void {
    this.io.emit(socketEvents.todoDeleted, {
      todoId,
      userId,
      username,
      timestamp: new Date()
    });
    logger.info(`Broadcasted todo:deleted event for todo: ${todoId}`);
  }

  /**
   * Broadcast todo locked event
   */
  public broadcastTodoLocked(todoId: string, userId: string, username: string): void {
    this.io.emit(socketEvents.todoLocked, {
      todoId,
      userId,
      username,
      lockedAt: new Date()
    });
    logger.info(`Broadcasted todo:locked event for todo: ${todoId} by ${username}`);
  }

  /**
   * Broadcast todo unlocked event
   */
  public broadcastTodoUnlocked(todoId: string, userId: string): void {
    this.io.emit(socketEvents.todoUnlocked, {
      todoId,
      userId,
      unlockedAt: new Date()
    });
    logger.info(`Broadcasted todo:unlocked event for todo: ${todoId}`);
  }

  /**
   * Get socket.io instance
   */
  public getIO(): SocketIOServer {
    return this.io;
  }

  /**
   * Get connected users count
   */
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get connected users list
   */
  public getConnectedUsers(): ConnectedUser[] {
    return Array.from(this.connectedUsers.values());
  }
}
