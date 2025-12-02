const esbuild = require('esbuild');
const { rmSync, mkdirSync } = require('fs');
const path = require('path');

// Clean dist folder
try {
  rmSync('dist', { recursive: true, force: true });
} catch (err) {
  // Directory doesn't exist, that's fine
}

// Create dist folder
mkdirSync('dist', { recursive: true });

// Build configuration
esbuild.build({
  entryPoints: ['src/server.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outfile: 'dist/server.js',
  sourcemap: true,
  minify: false, // Keep readable for debugging
  external: [
    // Mark all node_modules as external
    'bcryptjs',
    'cookie-parser',
    'cors',
    'dotenv',
    'express',
    'helmet',
    'joi',
    'jsonwebtoken',
    'mongoose',
    'morgan',
    'socket.io',
    'winston',
    'zod',
  ],
  loader: {
    '.ts': 'ts',
  },
  tsconfig: './tsconfig.build.json',
  logLevel: 'info',
}).then(() => {
  console.log('✓ Backend bundled successfully into dist/server.js');
}).catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
