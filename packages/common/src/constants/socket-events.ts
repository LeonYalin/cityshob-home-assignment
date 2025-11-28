/**
 * Socket.IO Event Names
 * Shared between frontend and backend
 */
export const socketEvents = {
  // Connection events
  connection: 'connection',
  connect: 'connect',
  disconnect: 'disconnect',
  connectError: 'connect_error',
  
  // User presence events
  userConnected: 'user:connected',
  userDisconnected: 'user:disconnected',
  usersList: 'users:list',
  requestUsersList: 'request:users:list',
  
  // Todo events
  todoCreated: 'todo:created',
  todoUpdated: 'todo:updated',
  todoDeleted: 'todo:deleted',
  todoLocked: 'todo:locked',
  todoUnlocked: 'todo:unlocked',
  
  // Error events
  error: 'error',
  authError: 'auth:error',
} as const;

export type SocketEventType = typeof socketEvents[keyof typeof socketEvents];
