# Real-Time To-Do App — Implementation Plan

## 📊 Implementation Progress

### ✅ **Completed Tasks**

#### 1. **Monorepo Architecture Setup** 
- ✅ Root package.json with npm workspaces
- ✅ TypeScript configuration for both projects
- ✅ Comprehensive .gitignore files
- ✅ Clean directory structure with proper separation

#### 2. **Backend Foundation & Architecture**
- ✅ Node.js/TypeScript Express server
- ✅ Live reload development setup (ts-node-dev)
- ✅ Production build pipeline (TypeScript → JavaScript)
- ✅ Environment configuration (.env support)
- ✅ CORS, Helmet, Morgan middleware
- ✅ Basic API endpoints (`/api/health`, `/api/hello`)
- ✅ Error handling middleware
- ✅ Jest testing framework with passing tests
- ✅ ESLint configuration
- ✅ Single production JS file deployment
- ✅ **Class-based architecture implementation**
- ✅ **Repository pattern with MongoDB and in-memory fallback**
- ✅ **Dependency injection with Factory patterns**
- ✅ **Zod validation schemas for type-safe APIs**
- ✅ **Structured logging with context-aware Logger class**

#### 3. **Frontend Foundation**
- ✅ Angular 18 with standalone components
- ✅ Zoneless change detection
- ✅ HttpClient configuration with fetch API
- ✅ API service for backend communication
- ✅ TypeScript interfaces for API responses
- ✅ Reactive UI with Angular signals
- ✅ Error handling and loading states
- ✅ Modern responsive styling
- ✅ Automatic API connectivity testing

#### 4. **Integration Testing**
- ✅ Frontend → Backend API communication
- ✅ CORS configuration working
- ✅ Development server setup
- ✅ Live reload for both services

### 🚧 **Next Steps (Remaining)**

1. **REST API** - Complete CRUD operations for todos (endpoints ready, needs testing)
2. **Real-time Features** - Socket.IO implementation for live updates
3. **Locking Mechanism** - Atomic operations and concurrency control
4. **Angular Frontend** - Task management UI components
5. **Complete Integration** - Full stack communication with real-time sync
6. **Testing & Documentation** - Comprehensive testing suite
7. **Authentication (Bonus)** - JWT implementation

### ✅ **Recently Completed**

#### **Backend Architecture Conversion (Class-based)**
- ✅ **Services converted to classes** - TodoService with constructor injection
- ✅ **Repository pattern implemented** - ITodoRepository interface with MongoDB and in-memory implementations
- ✅ **Factory patterns** - ServiceFactory and RepositoryFactory for dependency management
- ✅ **Logger service as class** - Context-aware logging with proper DI
- ✅ **Middleware remains modular** - Stateless functions following best practices
- ✅ **Controllers remain modular** - Stateless objects using service factories

---

## Overview
This document outlines the design and implementation plan for the **Real-Time To-Do List Application**.  
The goal is to build a clean, modular, real-time synchronized to-do app using modern technologies and design patterns.

---

## 1. Architecture Summary

**Tech Stack**
- **Frontend:** Angular + Angular Material + RxJS  
- **Backend:** Node.js (TypeScript) + Express.js + Socket.IO + Mongoose  
- **Database:** MongoDB Atlas (Free tier)
- **Monorepo:** npm workspaces
- **Realtime:** Socket.IO
- **Authentication (Bonus):** JWT

**Backend Architecture Pattern**
- **Classes for Stateful Components**: Services, Repositories, Logger, Database connections
- **Modules for Stateless Components**: Controllers, Middleware, Routes, Utilities
- **Dependency Injection**: Constructor injection with Factory patterns
- **Repository Pattern**: Data access abstraction with MongoDB and in-memory fallback
- **Service Layer**: Business logic with injected dependencies

**Monorepo Structure**
/package.json # Root workspace config
/packages
/frontend # Angular app
/backend # Express/Node app
tsconfig.json
README.md

yaml
Copy code

---

## 🚀 Current Working Setup

### **How to Run the Project**

```bash
# Install dependencies
npm install

# Start backend (Terminal 1)
cd packages/backend && npm run dev
# 🚀 Server running on http://localhost:4000

# Start frontend (Terminal 2)  
cd packages/frontend && npm start
# 🅰️ Angular dev server on http://localhost:4200
```

### **What's Currently Working**

1. **Backend API Server** (http://localhost:4000)
   - Health check: `GET /api/health`
   - Hello endpoint: `GET /api/hello`
   - CORS enabled for frontend communication
   - Live reload development

2. **Frontend Application** (http://localhost:4200)
   - Automatic API connectivity testing
   - Real-time status display (success/error/loading)
   - JSON response visualization
   - Retry functionality

3. **Development Experience**
   - Hot reload for both backend and frontend
   - TypeScript compilation
   - Error handling and logging
   - Responsive UI design

### **Project Structure (Implemented)**

```
real-time-todo-app/
├── package.json                 # ✅ Root workspace
├── tsconfig.json               # ✅ Shared TypeScript config  
├── README.md                   # ✅ Documentation
└── packages/
    ├── backend/                # ✅ Node.js API server
    │   ├── src/
    │   │   ├── server.ts       # ✅ Express server
    │   │   └── __tests__/      # ✅ Jest tests
    │   ├── dist/               # ✅ Production build
    │   ├── .env                # ✅ Environment config
    │   └── package.json        # ✅ Backend dependencies
    └── frontend/               # ✅ Angular application
        ├── src/app/
        │   ├── services/       # ✅ API service
        │   ├── app.ts          # ✅ Main component
        │   └── app.html        # ✅ UI template
        └── package.json        # ✅ Frontend dependencies
```

---

## 2. Backend Architecture (Class-Based Implementation)

### 2.1 Architecture Patterns ✅ **IMPLEMENTED**

#### **Classes (Stateful Components)**
- **Services**: Business logic with dependency injection
  ```typescript
  export class TodoService {
    constructor(
      private readonly todoRepository: ITodoRepository,
      private readonly logger: Logger
    ) {}
  }
  ```
- **Repositories**: Data access with connection management
  ```typescript
  export class MongoTodoRepository implements ITodoRepository {
    private readonly logger: Logger;
    constructor() {
      this.logger = new Logger('MongoTodoRepository');
    }
  }
  ```
- **Logger**: Context-aware logging service
- **Database Services**: Connection and state management

#### **Modules (Stateless Components)**
- **Controllers**: HTTP endpoint handlers
  ```typescript
  export const todoController = {
    getAllTodos: async (req, res, next) => {
      const todoService = await ServiceFactory.getTodoService();
      // ... implementation
    }
  };
  ```
- **Middleware**: Request/response processors (pure functions)
- **Routes**: Express route definitions
- **Utilities**: Pure helper functions

### 2.2 Dependency Injection & Factory Pattern ✅ **IMPLEMENTED**
- **ServiceFactory**: Creates and manages service instances
- **RepositoryFactory**: Selects MongoDB or in-memory repository based on availability
- **Constructor Injection**: All dependencies injected via constructors

### 2.3 Repository Pattern ✅ **IMPLEMENTED**
- **ITodoRepository Interface**: Defines data access contract
- **MongoTodoRepository**: MongoDB implementation with Mongoose
- **InMemoryTodoRepository**: Fallback implementation for development/testing
- **Automatic Fallback**: System automatically uses in-memory storage when MongoDB unavailable

---

## 3. Backend API Design

### 3.1 Architecture Layers
| Layer | Responsibility | Implementation Status |
|-------|----------------|----------------------|
| **Controller** | HTTP endpoints, validation, error handling | ✅ **COMPLETED** |
| **Service** | Business logic (locking, broadcasting, validation) | ✅ **COMPLETED** |
| **Repository** | Database operations (CRUD, atomic updates) | ✅ **COMPLETED** |
| **Socket Layer** | Real-time events & communication | 🚧 **PENDING** |
| **Model** | Mongoose schema + TypeScript interfaces | ✅ **COMPLETED** |

### 3.2 Design Patterns ✅ **IMPLEMENTED**
- **Repository Pattern:** Clean DB interaction with interface abstraction
- **Service Pattern:** Business logic encapsulation with dependency injection
- **Factory Pattern:** Dependency management and service creation
- **Singleton Pattern:** Database connection management
- **Strategy Pattern:** Repository selection (MongoDB vs in-memory)

### 3.3 Todo Model ✅ **IMPLEMENTED**
```ts
interface ITask {
  _id?: ObjectId;
  title: string;
  description?: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  lockedBy?: string | null;
  lockExpiresAt?: Date | null;
}
```

### 3.4 REST API Endpoints ✅ **IMPLEMENTED**

#### **✅ Currently Implemented**
| Method | Endpoint | Description | Status |
|--------|----------|-------------|---------|
| `GET` | `/api/health` | Server health check | ✅ Working |
| `GET` | `/api/hello` | Test endpoint | ✅ Working |

#### **🚧 Planned Implementation**
| Method | Endpoint | Description | Status |
|--------|----------|-------------|---------|
| `GET` | `/api/tasks` | List all tasks | 🚧 Pending |
| `GET` | `/api/tasks/:id` | Get task by ID | 🚧 Pending |
| `POST` | `/api/tasks` | Create new task | 🚧 Pending |
| `PUT` | `/api/tasks/:id` | Update existing task | 🚧 Pending |
| `DELETE` | `/api/tasks/:id` | Delete task | 🚧 Pending |
| `POST` | `/api/tasks/:id/lock` | Acquire edit lock | 🚧 Pending |
| `POST` | `/api/tasks/:id/unlock` | Release edit lock | 🚧 Pending |

2.5 Real-Time Events (Socket.IO)
Server → Client

tasks:created

tasks:updated

tasks:deleted

tasks:lock:acquired

tasks:lock:released

Client → Server

tasks:subscribe

tasks:lock:acquire

tasks:lock:release

3. Locking & Concurrency Design
3.1 Atomic Lock Acquisition
ts
Copy code
const result = await Task.findOneAndUpdate(
  {
    _id: id,
    $or: [
      { lockedBy: null },
      { lockExpiresAt: { $lte: new Date() } }
    ]
  },
  { lockedBy: userId, lockExpiresAt: new Date(Date.now() + 2 * 60 * 1000) },
  { new: true }
);
If result is null, the task is already locked.

Locks automatically expire after lockExpiresAt.

3.2 Optimistic Concurrency
Use updatedAt or __v field:

ts
Copy code
Task.findOneAndUpdate(
  { _id: id, updatedAt: clientUpdatedAt },
  { ...updates, $inc: { __v: 1 } },
  { new: true }
);
If no document is found, return 409 Conflict.

4. Frontend Design
4.1 Structure
Component	Responsibility
TaskListComponent	Displays list of tasks
TaskItemComponent	Renders single task item
TaskEditDialogComponent	Modal for editing
TaskService	Handles REST & Socket.IO
AuthService	(Bonus) JWT login management

4.2 Patterns Used
Service Pattern: Centralize API + socket logic.

Reactive Programming (RxJS): Use BehaviorSubject for tasks.

Modular Design: Feature modules for scalability.

4.3 Reactive Data Flow
TaskService exposes tasks$ observable.

Components subscribe to tasks$ for real-time updates.

When a socket event is received, the service updates tasks$.

4.4 Locking UX
On edit, client requests lock.

If acquired, user can edit; otherwise shows "Locked by X".

Locks auto-release when edit is done or after timeout.

Prevent delete/update while another user holds the lock.

5. Socket.IO Integration
5.1 Server
Initialized in a Singleton factory.

Emits updates after CRUD events.

5.2 Client
Uses ngx-socket-io or plain socket.io-client.

Subscribes to task-related events.

Updates local task list reactively.

6. Authentication (Bonus)
Implement login & register endpoints.

Issue JWT on login.

Attach token to REST and socket connection.

Decode JWT on socket handshake for user identification.

Store lockedBy as userId or userName.

7. Development Setup
Root package.json
json
Copy code
{
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "start:dev": "concurrently \"npm:dev:*\"",
    "dev:frontend": "npm --workspace frontend start",
    "dev:backend": "npm --workspace backend run dev"
  }
}
Backend Scripts
json
Copy code
"scripts": {
  "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
  "build": "tsc -p tsconfig.build.json",
  "start": "node dist/server.js",
  "lint": "eslint 'src/**/*.ts'"
}
8. Testing & Quality
Testing Stack
Backend: Jest + mongodb-memory-server

Frontend: Jasmine/Karma or Jest

E2E: Cypress (multi-client scenario)

CI Pipeline
Lint → Unit Tests → Build → Integration Tests

GitHub Actions recommended

9. Deployment Notes
MongoDB Atlas for database (free tier).

Backend: Render / Railway / Vercel / Heroku.

Frontend: Netlify / Vercel.

Env vars:

ini
Copy code
MONGODB_URI=
JWT_SECRET=
PORT=4000
SOCKET_ORIGIN_WHITELIST=http://localhost:4200
10. Security & Robustness
Input validation via Joi or class-validator.

Rate limit lock operations.

HTTPS in production.

Handle socket disconnects gracefully (optional auto-unlock on disconnect).

11. Edge Cases
Lost locks: auto-expire after lockExpiresAt.

Edit collision: detect via updatedAt mismatch → prompt user.

Multiple tabs: allow same userId to refresh lock.

Disconnected user: lock eventually expires.

12. Timeline (5 Days)
Day	Goals
Day 1	Setup monorepo, backend & frontend skeleton, DB model
Day 2	Implement REST CRUD + Angular list & basic UI
Day 3	Add Socket.IO realtime sync
Day 4	Implement locking + concurrency logic
Day 5	Polish, optional JWT, write README, CI, cleanup

13. README Checklist
 Overview & architecture diagram

 Setup instructions (Node, npm, Angular CLI)

 .env.example file

 Start commands

 Explanation of locking system

 Design patterns used

 Test commands

 Bonus features

 Known limitations

14. Extra Credit Ideas
Task priority & due date

Activity log

Push notifications

Deployed demo link

Postman collection

15. Implementation Checklist
 Monorepo setup

 Backend CRUD APIs

 Angular task list UI

 Real-time Socket.IO sync

 Locking mechanism

 Optimistic concurrency

 Unit & E2E tests

 Documentation

 (Bonus) JWT Auth

16. Example Lock Function (Backend)
ts
Copy code
async function acquireLock(taskId: string, userId: string, durationSec = 120) {
  const now = new Date();
  const expires = new Date(now.getTime() + durationSec * 1000);

  const task = await TaskModel.findOneAndUpdate(
    {
      _id: taskId,
      $or: [{ lockedBy: null }, { lockExpiresAt: { $lte: now } }]
    },
    { lockedBy: userId, lockExpiresAt: expires },
    { new: true }
  ).lean();

  return task; // null if cannot acquire lock
}

## 17. Updated Implementation Status

### ✅ **Phase 1: Foundation (COMPLETED)**
- ✅ Monorepo setup with npm workspaces
- ✅ TypeScript backend with Express.js
- ✅ Angular 18 frontend with standalone components
- ✅ Development environment with live reload
- ✅ API connectivity testing
- ✅ Production build pipeline
- ✅ Basic testing framework

### 🚧 **Phase 2: Core Functionality (IN PROGRESS)**
- 🚧 MongoDB integration and Task model
- 🚧 Backend architecture layers (Service/Repository)
- 🚧 CRUD API endpoints for tasks
- 🚧 Angular Material UI components
- 🚧 Task management interface

### 📋 **Phase 3: Real-time Features (PLANNED)**
- 📋 Socket.IO integration
- 📋 Real-time task synchronization
- 📋 Locking mechanism for concurrent editing
- 📋 Optimistic concurrency control

### 🎯 **Phase 4: Advanced Features (OPTIONAL)**
- 🎯 JWT authentication
- 🎯 User management
- 🎯 Task priorities and due dates
- 🎯 Activity logging

### 🧪 **Current Demo Status**
- ✅ **Backend API**: Basic endpoints working
- ✅ **Frontend**: API connectivity testing UI
- ✅ **Integration**: CORS and HTTP communication verified
- 🚧 **Task Management**: Not yet implemented
- 🚧 **Real-time**: Socket.IO not yet integrated

### 📊 **Next Immediate Steps**
1. Setup MongoDB connection and Task model
2. Implement basic CRUD operations for tasks
3. Create Angular task list components
4. Add Socket.IO for real-time updates
5. Implement locking mechanism

End of Plan