const { spawn } = require('child_process');
const path = require('path');
const { API_CONFIG, CONFIG } = require('./config');
const logger = require('./utils/node-logger');

// Configuration
const serverConfig = {
  API_HOST: process.env.API_HOST || API_CONFIG.HOST,
  NODE_ENV: process.env.NODE_ENV || 'production',
  PORT: process.env.PORT || '3000',
  LOGS_DIR: process.env.LOGS_DIR || path.join(process.cwd(), 'logs'),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

// Log configuration
logger.info('Starting Next.js with configuration:');
logger.info('-----------------------------------');
logger.info('Server Configuration:');
logger.info(`  API_HOST: ${serverConfig.API_HOST}`);
logger.info(`  NODE_ENV: ${serverConfig.NODE_ENV}`);
logger.info(`  PORT: ${serverConfig.PORT}`);
logger.info('\nApplication Configuration:');
logger.info(`  API_VERSION: ${API_CONFIG.VERSION}`);
logger.info(`  OAUTH_WITH_GOOGLE: ${CONFIG.OAUTH_WITH_GOOGLE}`);
logger.info('\nLogging Configuration:');
logger.info(`  LOGS_DIR: ${serverConfig.LOGS_DIR}`);
logger.info(`  LOG_LEVEL: ${serverConfig.LOG_LEVEL}`);
logger.info('-----------------------------------');

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
    NODE_ENV: serverConfig.NODE_ENV,
    LOGS_DIR: serverConfig.LOGS_DIR,
    LOG_LEVEL: serverConfig.LOG_LEVEL
  }
});

next.on('error', (err) => {
  logger.error('Failed to start Next.js:', { error: err.message });
  process.exit(1);
});
