import { Todo } from './todo.types';

/**
 * JWT User Payload - represents decoded JWT token data
 */
export interface JWTUserPayload {
  userId: string;
  username: string;
  email: string;
}

/**
 * Connected user interface - represents a user connected via WebSocket
 */
export interface ConnectedUser extends JWTUserPayload {
  socketId: string;
  /** ISO 8601 date string (UTC recommended)
   * @example "2024-12-02T10:00:00.000Z"
   */
  connectedAt: string;
}

/**
 * Todo created/updated event
 */
export interface TodoEvent {
  todo: Todo;
  userId: string;
  username: string;
  /** ISO 8601 date string (UTC recommended)
   * @example "2024-12-02T10:00:00.000Z"
   */
  timestamp: string;
}

/**
 * Todo created event
 */
export interface TodoCreatedEvent extends TodoEvent {}

/**
 * Todo updated event
 */
export interface TodoUpdatedEvent extends TodoEvent {}

/**
 * Todo deleted event
 */
export interface TodoDeletedEvent {
  todoId: string;
  userId: string;
  username: string;
  /** ISO 8601 date string (UTC recommended)
   * @example "2024-12-02T10:00:00.000Z"
   */
  timestamp: string;
}

/**
 * Todo locked event
 */
export interface TodoLockedEvent {
  todoId: string;
  userId: string;
  username: string;
  /** ISO 8601 date string (UTC recommended)
   * @example "2024-12-02T10:00:00.000Z"
   */
  lockedAt: string;
}

/**
 * Todo unlocked event
 */
export interface TodoUnlockedEvent {
  todoId: string;
  userId: string;
  /** ISO 8601 date string (UTC recommended)
   * @example "2024-12-02T10:00:00.000Z"
   */
  unlockedAt: string;
}

/**
 * Socket error event
 */
export interface SocketErrorEvent {
  message: string;
  code?: string;
}

/**
 * Socket authentication error event
 */
export interface SocketAuthErrorEvent {
  message: string;
  reason: 'invalid_token' | 'expired_token' | 'no_token';
}
