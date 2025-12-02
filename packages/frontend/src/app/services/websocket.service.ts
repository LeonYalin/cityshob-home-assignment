import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { 
  socketEvents,
  ConnectedUser,
  TodoEvent,
  TodoDeletedEvent,
  TodoLockedEvent,
  TodoUnlockedEvent
} from '@real-time-todo/common';
import { environment } from '../../environments/environment';

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
  private todoLockedCallbacks: Array<(event: TodoLockedEvent) => void> = [];
  private todoUnlockedCallbacks: Array<(event: TodoUnlockedEvent) => void> = [];

  constructor() {}

  /**
   * Environment-aware logging
   */
  private log(message: string, ...args: any[]): void {
    if (!environment.production) {
      console.log(`[WebSocket] ${message}`, ...args);
    }
  }

  /**
   * Connect to WebSocket server
   */
  public connect(): void {
    if (this.socket?.connected) {
      this.log('Already connected');
      return;
    }

    this.log('Connecting to WebSocket...');
    this.socket = io('http://localhost:4000', {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      extraHeaders: {
        // Cookies will be sent automatically with withCredentials: true
      }
    });

    this.setupEventListeners();
    this.log('Connection initiated');
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
      this.log('Disconnected');
    }
  }

  /**
   * Setup Socket.IO event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on(socketEvents.connect, () => {
      this.log('Connected:', this.socket?.id);
      this.isConnected.set(true);
      this.requestUsersList();
    });

    this.socket.on(socketEvents.disconnect, (reason) => {
      this.log('Disconnected:', reason);
      this.isConnected.set(false);
      this.connectedUsers.set([]);
    });

    this.socket.on(socketEvents.connectError, (error) => {
      this.log('Connection error:', error);
      this.isConnected.set(false);
    });

    // User presence events
    this.socket.on(socketEvents.userConnected, (user: Omit<ConnectedUser, 'connectedAt'> & { connectedAt: string }) => {
      this.log('User connected:', user);
      const currentUsers = this.connectedUsers();
      const connectedUser: ConnectedUser = {
        ...user,
        connectedAt: user.connectedAt
      };
      this.connectedUsers.set([...currentUsers, connectedUser]);
    });

    this.socket.on(socketEvents.userDisconnected, (data: { userId: string; username: string }) => {
      this.log('User disconnected:', data);
      const currentUsers = this.connectedUsers();
      this.connectedUsers.set(currentUsers.filter(u => u.userId !== data.userId));
    });

    this.socket.on(socketEvents.usersList, (users: Array<Omit<ConnectedUser, 'connectedAt'> & { connectedAt: string }>) => {
      this.log('Received users list:', users);
      const connectedUsers: ConnectedUser[] = users.map(user => ({
        ...user,
        connectedAt: user.connectedAt
      }));
      this.connectedUsers.set(connectedUsers);
    });

    // Todo CRUD events
    this.socket.on(socketEvents.todoCreated, (event: Omit<TodoEvent, 'timestamp'> & { timestamp: string }) => {
      this.log('Todo created:', event);
      const todoEvent: TodoEvent = {
        ...event,
        timestamp: event.timestamp
      };
      this.todoCreatedCallbacks.forEach(cb => cb(todoEvent));
    });

    this.socket.on(socketEvents.todoUpdated, (event: Omit<TodoEvent, 'timestamp'> & { timestamp: string }) => {
      this.log('Todo updated:', event);
      const todoEvent: TodoEvent = {
        ...event,
        timestamp: event.timestamp
      };
      this.todoUpdatedCallbacks.forEach(cb => cb(todoEvent));
    });

    this.socket.on(socketEvents.todoDeleted, (event: Omit<TodoDeletedEvent, 'timestamp'> & { timestamp: string }) => {
      this.log('Todo deleted:', event);
      const todoEvent: TodoDeletedEvent = {
        ...event,
        timestamp: event.timestamp
      };
      this.todoDeletedCallbacks.forEach(cb => cb(todoEvent));
    });

    // Todo locking events
    this.socket.on(socketEvents.todoLocked, (event: Omit<TodoLockedEvent, 'lockedAt'> & { lockedAt: string }) => {
      this.log('Todo locked:', event);
      const lockEvent: TodoLockedEvent = {
        ...event,
        lockedAt: event.lockedAt
      };
      this.todoLockedCallbacks.forEach(cb => cb(lockEvent));
    });

    this.socket.on(socketEvents.todoUnlocked, (event: Omit<TodoUnlockedEvent, 'unlockedAt'> & { unlockedAt: string }) => {
      this.log('Todo unlocked:', event);
      const unlockEvent: TodoUnlockedEvent = {
        ...event,
        unlockedAt: event.unlockedAt
      };
      this.todoUnlockedCallbacks.forEach(cb => cb(unlockEvent));
    });

    // Error events
    this.socket.on(socketEvents.error, (error: { message: string }) => {
      this.log('Error:', error);
    });

    this.socket.on(socketEvents.authError, (error: { message: string }) => {
      this.log('Auth error:', error);
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
   * Returns a cleanup function to unregister the callback
   */
  public onTodoCreated(callback: (event: TodoEvent) => void): () => void {
    this.todoCreatedCallbacks.push(callback);
    return () => {
      const index = this.todoCreatedCallbacks.indexOf(callback);
      if (index > -1) {
        this.todoCreatedCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Register callback for todo updated events
   * Returns a cleanup function to unregister the callback
   */
  public onTodoUpdated(callback: (event: TodoEvent) => void): () => void {
    this.todoUpdatedCallbacks.push(callback);
    return () => {
      const index = this.todoUpdatedCallbacks.indexOf(callback);
      if (index > -1) {
        this.todoUpdatedCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Register callback for todo deleted events
   * Returns a cleanup function to unregister the callback
   */
  public onTodoDeleted(callback: (event: TodoDeletedEvent) => void): () => void {
    this.todoDeletedCallbacks.push(callback);
    return () => {
      const index = this.todoDeletedCallbacks.indexOf(callback);
      if (index > -1) {
        this.todoDeletedCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Register callback for todo locked events
   * Returns a cleanup function to unregister the callback
   */
  public onTodoLocked(callback: (event: TodoLockedEvent) => void): () => void {
    this.todoLockedCallbacks.push(callback);
    return () => {
      const index = this.todoLockedCallbacks.indexOf(callback);
      if (index > -1) {
        this.todoLockedCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Register callback for todo unlocked events
   * Returns a cleanup function to unregister the callback
   */
  public onTodoUnlocked(callback: (event: TodoUnlockedEvent) => void): () => void {
    this.todoUnlockedCallbacks.push(callback);
    return () => {
      const index = this.todoUnlockedCallbacks.indexOf(callback);
      if (index > -1) {
        this.todoUnlockedCallbacks.splice(index, 1);
      }
    };
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
