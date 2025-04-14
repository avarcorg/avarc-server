const { spawn } = require('child_process');
const path = require('path');

// Start Next.js using the standard path
const next = spawn('node', [
  path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next'),
  'start',
  '--port', '3000'
], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production'
  }
});

next.on('error', (err) => {
  console.error('Failed to start Next.js:', err);
  process.exit(1);
});
