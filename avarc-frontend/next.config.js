const { API_CONFIG, CONFIG } = require('./config');
const logger = require('./utils/node-logger');

// Log configuration
logger.info('Next.js Configuration:');
logger.info('-----------------------------------');
logger.info('Application Configuration:');
logger.info(`  API_HOST: ${process.env.NEXT_PUBLIC_API_HOST || API_CONFIG.HOST}`);
logger.info(`  API_VERSION: ${API_CONFIG.VERSION}`);
logger.info(`  OAUTH_WITH_GOOGLE: ${CONFIG.OAUTH_WITH_GOOGLE}`);
logger.info('-----------------------------------');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_HOST: process.env.NEXT_PUBLIC_API_HOST || API_CONFIG.HOST,
    NEXT_PUBLIC_API_VERSION: API_CONFIG.VERSION,
    NEXT_PUBLIC_OAUTH_WITH_GOOGLE: CONFIG.OAUTH_WITH_GOOGLE.toString(),
  },
};

module.exports = nextConfig;
