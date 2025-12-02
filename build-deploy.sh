#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment build..."

# Clean root dist folder
echo "🧹 Cleaning dist folder..."
rm -rf dist
mkdir -p dist

# Build backend
echo "📦 Building backend..."
cd packages/backend
npm install
npm run build
cd ../..

# Build frontend
echo "🅰️ Building frontend..."
cd packages/frontend
npm install
npm run build
cd ../..

# Copy backend build
echo "📋 Copying backend build..."
cp packages/backend/dist/server.js dist/server.js
cp packages/backend/dist/server.js.map dist/server.js.map 2>/dev/null || true

# Copy frontend build  
echo "📋 Copying frontend build..."
rm -rf dist/frontend
mkdir -p dist/frontend
cp -r packages/frontend/dist/browser/* dist/frontend/

# Create production package.json
echo "📝 Creating production package.json..."
cat > dist/package.json << 'EOF'
{
  "name": "real-time-todo-app",
  "version": "1.0.0",
  "description": "Real-time To-Do List Application - Production Build",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "helmet": "^7.0.0",
    "joi": "^17.10.1",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^7.5.0",
    "morgan": "^1.10.1",
    "socket.io": "^4.7.2",
    "winston": "^3.18.3",
    "zod": "^4.1.12"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Copy .env if it exists
if [ -f packages/backend/.env ]; then
  echo "📋 Copying .env file..."
  cp packages/backend/.env dist/.env
else
  echo "⚠️  No .env file found. Create one in dist/ folder with production settings."
fi

# Create .env.example
cat > dist/.env.example << 'EOF'
# Server Configuration
PORT=4000
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/todo-app

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS
SOCKET_ORIGIN_WHITELIST=http://localhost:4000

# Logging
LOG_LEVEL=info
EOF

echo ""
echo "✅ Deployment build complete!"
echo ""
echo "📁 Output directory: ./dist"
echo "   - server.js (bundled backend)"
echo "   - frontend/ (Angular app)"
echo "   - package.json (production dependencies)"
echo "   - .env.example (configuration template)"
echo ""
echo "🚀 To deploy:"
echo "   1. Copy ./dist folder to your server"
echo "   2. cd dist && npm install --production"
echo "   3. Configure .env file with production settings"
echo "   4. npm start"
echo ""
