# Real-Time To-Do List Application

A real-time synchronized to-do application with collaborative editing features.

## Tech Stack

- **Frontend**: Angular + Angular Material + Socket.IO Client
- **Backend**: Node.js (TypeScript) + Express.js + Socket.IO + Mongoose
- **Database**: MongoDB
- **Monorepo**: npm workspaces

## Project Structure

```
real-time-todo-app/
├── package.json           # Root workspace
├── packages/
    ├── backend/           # Node.js API server
    ├── common/            # Shared types and constants
    └── frontend/          # Angular 18 application
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation
```bash
# Install dependencies
npm install

# Setup environment
cp packages/backend/.env.example packages/backend/.env
```

### Development
```bash
# Start both services
npm run start:dev

# Backend: http://localhost:4000
# Frontend: http://localhost:4200
```

## Scripts

```bash
npm run start:dev      # Start both frontend and backend
npm run dev:backend    # Backend only
npm run dev:frontend   # Frontend only
npm run build          # Build both projects
npm run test           # Run all tests
npm run lint           # Lint all workspaces
```

## Status

✅ **Real-Time Collaboration Completed** - Full WebSocket integration with todo locking, user presence tracking, and conflict prevention.

✅ **Cookie-Based Authentication Completed** - Secure HTTP-only cookie authentication system implemented with maximum XSS/CSRF protection and zero localStorage usage.

✅ **Common Package Implemented** - Shared type definitions and constants across frontend and backend eliminate code duplication.

---

**Author**: Leon Yalin  
**Repository**: [cityshob-home-assignment](https://github.com/LeonYalin/cityshob-home-assignment)
