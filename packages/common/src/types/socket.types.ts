import { Todo } from './todo.types';

/**
 * Connected user interface
 */
export interface ConnectedUser {
  userId: string;
  username: string;
  email: string;
  socketId?: string;
  connectedAt?: string;
}

/**
 * Todo created/updated event
 */
export interface TodoEvent {
  todo: Todo;
  userId: string;
  username: string;
  timestamp: string;
}

/**
 * Todo deleted event
 */
export interface TodoDeletedEvent {
  todoId: string;
  userId: string;
  username: string;
  timestamp: string;
}

/**
 * Todo locked event
 */
export interface TodoLockEvent {
  todoId: string;
  userId: string;
  username: string;
  lockedAt: string;
}

/**
 * Todo unlocked event
 */
export interface TodoUnlockEvent {
  todoId: string;
  userId: string;
  unlockedAt: string;
}
