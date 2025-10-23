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
    └── frontend/          # Angular application
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

🚧 **In Development** - Basic project structure is set up, implementation in progress.

---

**Author**: Leon Yalin  
**Repository**: [cityshob-home-assignment](https://github.com/LeonYalin/cityshob-home-assignment)
