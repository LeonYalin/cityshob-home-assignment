# @real-time-todo/common

Shared TypeScript types, interfaces, and constants for the Real-Time Todo Application.

## Purpose

This package serves as the single source of truth for:
- **Type definitions** shared between frontend and backend
- **API contracts** for REST endpoints
- **WebSocket event types** for real-time communication
- **Validation constraints** for consistent data validation

## Installation

This package is part of a monorepo and should be referenced locally:

```json
{
  "dependencies": {
    "@real-time-todo/common": "workspace:*"
  }
}
```

## Usage

### Importing Types

```typescript
import { 
  Todo, 
  CreateTodoRequest, 
  GetTodosResponse,
  User,
  LoginRequest,
  socketEvents,
  TODO_CONSTRAINTS 
} from '@real-time-todo/common';
```

## Type Catalog

### Todo Types

#### `Todo`
Core todo item interface.

```typescript
interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: Priority; // 'low' | 'medium' | 'high'
  createdBy: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  lockedBy?: string;
  lockedAt?: string; // ISO 8601
}
```

#### Request/Response Types
- `CreateTodoRequest` - Create new todo
- `UpdateTodoRequest` - Update existing todo
- `GetTodosQueryParams` - Query parameters for filtering
- `CreateTodoResponse` - Response from create endpoint
- `UpdateTodoResponse` - Response from update endpoint
- `GetTodoResponse` - Single todo response
- `GetTodosResponse` - Paginated todos response
- `DeleteTodoResponse` - Delete confirmation
- `LockTodoResponse` - Lock confirmation with lock data
- `UnlockTodoResponse` - Unlock confirmation

### Auth Types

#### `User`
User account information.

```typescript
interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

#### Request/Response Types
- `RegisterRequest` - User registration data
- `LoginRequest` - User login credentials
- `RegisterResponse` - Registration result with user data
- `LoginResponse` - Login result with user data and token
- `LogoutResponse` - Logout confirmation
- `GetCurrentUserResponse` - Current authenticated user

### Socket Types

#### Connection Types
- `JWTUserPayload` - Decoded JWT token data
- `ConnectedUser` - WebSocket connected user with socket info

#### Event Types
- `TodoCreatedEvent` - Emitted when todo is created
- `TodoUpdatedEvent` - Emitted when todo is updated
- `TodoDeletedEvent` - Emitted when todo is deleted
- `TodoLockedEvent` - Emitted when todo is locked for editing
- `TodoUnlockedEvent` - Emitted when todo is unlocked
- `SocketErrorEvent` - General socket error
- `SocketAuthErrorEvent` - Authentication error with reason

### API Types

#### Generic Response Wrappers
```typescript
// All API responses follow this structure
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Paginated responses
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

### Constants

#### Socket Events
```typescript
import { socketEvents } from '@real-time-todo/common';

socket.emit(socketEvents.todoCreated, data);
socket.on(socketEvents.todoUpdated, handler);
```

Available events:
- `connection`, `connect`, `disconnect`, `connectError`
- `userConnected`, `userDisconnected`, `usersList`
- `todoCreated`, `todoUpdated`, `todoDeleted`
- `todoLocked`, `todoUnlocked`
- `error`, `authError`

#### Validation Constraints
```typescript
import { TODO_CONSTRAINTS, USER_CONSTRAINTS } from '@real-time-todo/common';

// Use in validation schemas
const titleSchema = z.string()
  .min(TODO_CONSTRAINTS.TITLE_MIN_LENGTH)
  .max(TODO_CONSTRAINTS.TITLE_MAX_LENGTH);
```

**Todo Constraints:**
- `TITLE_MIN_LENGTH: 1`
- `TITLE_MAX_LENGTH: 200`
- `DESCRIPTION_MAX_LENGTH: 1000`

**User Constraints:**
- `USERNAME_MIN_LENGTH: 3`
- `USERNAME_MAX_LENGTH: 50`
- `PASSWORD_MIN_LENGTH: 6`
- `EMAIL_MAX_LENGTH: 255`

## Date Format

All date fields use **ISO 8601 format strings** (not Date objects) for consistency across serialization boundaries:

```typescript
"2024-12-02T10:00:00.000Z" // UTC timezone recommended
```

This applies to:
- `Todo.createdAt`, `updatedAt`, `lockedAt`
- `User.createdAt`, `updatedAt`
- `ConnectedUser.connectedAt`
- All socket event timestamps

## Versioning Policy

This package follows semantic versioning:
- **Major**: Breaking changes to type definitions (e.g., changing field types)
- **Minor**: New types or optional fields added
- **Patch**: Documentation updates, non-breaking improvements

## Breaking Changes

### v1.0.0
- Changed all date fields from `Date` to `string` (ISO 8601 format)
- Consolidated response types to use `ApiResponse<T>` generic
- Renamed socket event interfaces for consistency (`TodoLockEvent` → `TodoLockedEvent`)
- Made `ConnectedUser.socketId` and `connectedAt` required fields

## Development

Build the package:
```bash
npm run build
```

Clean build artifacts:
```bash
npm run clean
```

## License

ISC
