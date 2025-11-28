import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { 
  socketEvents,
  ConnectedUser,
  TodoEvent,
  TodoDeletedEvent,
  TodoLockEvent,
  TodoUnlockEvent
} from '@real-time-todo/common';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket | null = null;
  
  // Signals for reactive state management
  public connectedUsers = signal<ConnectedUser[]>([]);
  public isConnected = signal<boolean>(false);
  
  // Event callbacks
  private todoCreatedCallbacks: Array<(event: TodoEvent) => void> = [];
  private todoUpdatedCallbacks: Array<(event: TodoEvent) => void> = [];
  private todoDeletedCallbacks: Array<(event: TodoDeletedEvent) => void> = [];
  private todoLockedCallbacks: Array<(event: TodoLockEvent) => void> = [];
  private todoUnlockedCallbacks: Array<(event: TodoUnlockEvent) => void> = [];

  constructor() {}

  /**
   * Connect to WebSocket server
   */
  public connect(): void {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    console.log('Connecting to WebSocket...');
    this.socket = io('http://localhost:4000', {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      extraHeaders: {
        // Cookies will be sent automatically with withCredentials: true
      }
    });

    this.setupEventListeners();
    console.log('WebSocket connection initiated');
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected.set(false);
      this.connectedUsers.set([]);
      console.log('WebSocket disconnected');
    }
  }

  /**
   * Setup Socket.IO event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on(socketEvents.connect, () => {
      console.log('WebSocket connected:', this.socket?.id);
      this.isConnected.set(true);
      this.requestUsersList();
    });

    this.socket.on(socketEvents.disconnect, (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected.set(false);
      this.connectedUsers.set([]);
    });

    this.socket.on(socketEvents.connectError, (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnected.set(false);
    });

    // User presence events
    this.socket.on(socketEvents.userConnected, (user: Omit<ConnectedUser, 'connectedAt'> & { connectedAt: string }) => {
      console.log('User connected:', user);
      const currentUsers = this.connectedUsers();
      const connectedUser: ConnectedUser = {
        ...user,
        connectedAt: user.connectedAt
      };
      this.connectedUsers.set([...currentUsers, connectedUser]);
    });

    this.socket.on(socketEvents.userDisconnected, (data: { userId: string; username: string }) => {
      console.log('User disconnected:', data);
      const currentUsers = this.connectedUsers();
      this.connectedUsers.set(currentUsers.filter(u => u.userId !== data.userId));
    });

    this.socket.on(socketEvents.usersList, (users: Array<Omit<ConnectedUser, 'connectedAt'> & { connectedAt: string }>) => {
      console.log('Received users list:', users);
      const connectedUsers: ConnectedUser[] = users.map(user => ({
        ...user,
        connectedAt: user.connectedAt
      }));
      this.connectedUsers.set(connectedUsers);
    });

    // Todo CRUD events
    this.socket.on(socketEvents.todoCreated, (event: Omit<TodoEvent, 'timestamp'> & { timestamp: string }) => {
      console.log('Todo created:', event);
      const todoEvent: TodoEvent = {
        ...event,
        timestamp: event.timestamp
      };
      this.todoCreatedCallbacks.forEach(cb => cb(todoEvent));
    });

    this.socket.on(socketEvents.todoUpdated, (event: Omit<TodoEvent, 'timestamp'> & { timestamp: string }) => {
      console.log('Todo updated:', event);
      const todoEvent: TodoEvent = {
        ...event,
        timestamp: event.timestamp
      };
      this.todoUpdatedCallbacks.forEach(cb => cb(todoEvent));
    });

    this.socket.on(socketEvents.todoDeleted, (event: Omit<TodoDeletedEvent, 'timestamp'> & { timestamp: string }) => {
      console.log('Todo deleted:', event);
      const todoEvent: TodoDeletedEvent = {
        ...event,
        timestamp: event.timestamp
      };
      this.todoDeletedCallbacks.forEach(cb => cb(todoEvent));
    });

    // Todo locking events
    this.socket.on(socketEvents.todoLocked, (event: Omit<TodoLockEvent, 'lockedAt'> & { lockedAt: string }) => {
      console.log('Todo locked:', event);
      const lockEvent: TodoLockEvent = {
        ...event,
        lockedAt: event.lockedAt
      };
      this.todoLockedCallbacks.forEach(cb => cb(lockEvent));
    });

    this.socket.on(socketEvents.todoUnlocked, (event: Omit<TodoUnlockEvent, 'unlockedAt'> & { unlockedAt: string }) => {
      console.log('Todo unlocked:', event);
      const unlockEvent: TodoUnlockEvent = {
        ...event,
        unlockedAt: event.unlockedAt
      };
      this.todoUnlockedCallbacks.forEach(cb => cb(unlockEvent));
    });

    // Error events
    this.socket.on(socketEvents.error, (error: { message: string }) => {
      console.error('WebSocket error:', error);
    });

    this.socket.on(socketEvents.authError, (error: { message: string }) => {
      console.error('WebSocket auth error:', error);
      this.disconnect();
    });
  }

  /**
   * Request the current list of online users
   */
  public requestUsersList(): void {
    if (this.socket?.connected) {
      this.socket.emit(socketEvents.requestUsersList);
    }
  }

  /**
   * Get auth token from cookie
   */
  private getAuthToken(): string | null {
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(c => c.trim().startsWith('auth_token='));
    return authCookie ? authCookie.split('=')[1] : null;
  }

  /**
   * Register callback for todo created events
   */
  public onTodoCreated(callback: (event: TodoEvent) => void): void {
    this.todoCreatedCallbacks.push(callback);
  }

  /**
   * Register callback for todo updated events
   */
  public onTodoUpdated(callback: (event: TodoEvent) => void): void {
    this.todoUpdatedCallbacks.push(callback);
  }

  /**
   * Register callback for todo deleted events
   */
  public onTodoDeleted(callback: (event: TodoDeletedEvent) => void): void {
    this.todoDeletedCallbacks.push(callback);
  }

  /**
   * Register callback for todo locked events
   */
  public onTodoLocked(callback: (event: TodoLockEvent) => void): void {
    this.todoLockedCallbacks.push(callback);
  }

  /**
   * Register callback for todo unlocked events
   */
  public onTodoUnlocked(callback: (event: TodoUnlockEvent) => void): void {
    this.todoUnlockedCallbacks.push(callback);
  }

  /**
   * Remove all callbacks (cleanup on destroy)
   */
  public clearCallbacks(): void {
    this.todoCreatedCallbacks = [];
    this.todoUpdatedCallbacks = [];
    this.todoDeletedCallbacks = [];
    this.todoLockedCallbacks = [];
    this.todoUnlockedCallbacks = [];
  }
}
