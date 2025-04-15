const { spawn } = require('child_process');
const path = require('path');
const { API_CONFIG, CONFIG } = require('./config');

// Configuration
const serverConfig = {
  API_HOST: process.env.API_HOST || API_CONFIG.HOST,
  NODE_ENV: process.env.NODE_ENV || 'production',
  PORT: process.env.PORT || '3000'
};

// Log configuration
console.log('Starting Next.js with configuration:');
console.log('-----------------------------------');
console.log('Server Configuration:');
console.log(`  API_HOST: ${serverConfig.API_HOST}`);
console.log(`  NODE_ENV: ${serverConfig.NODE_ENV}`);
console.log(`  PORT: ${serverConfig.PORT}`);
console.log('\nApplication Configuration:');
console.log(`  API_VERSION: ${API_CONFIG.VERSION}`);
console.log(`  OAUTH_WITH_GOOGLE: ${CONFIG.OAUTH_WITH_GOOGLE}`);
console.log('-----------------------------------');

// Start Next.js using the standard path
const next = spawn('node', [
  path.join(__dirname, '.next', 'standalone', 'node_modules', 'next', 'dist', 'bin', 'next'),
  'start',
  '--port', serverConfig.PORT
], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NEXT_PUBLIC_API_HOST: serverConfig.API_HOST,
    NODE_ENV: serverConfig.NODE_ENV
  }
});

next.on('error', (err) => {
  console.error('Failed to start Next.js:', err);
  process.exit(1);
});
