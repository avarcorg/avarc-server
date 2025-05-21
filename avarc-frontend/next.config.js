const { API_CONFIG, CONFIG } = require('./config');
const { i18n } = require('./next-i18next.config');
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
  i18n,
  output: 'standalone', // Important for production deployments
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_HOST: process.env.NEXT_PUBLIC_API_HOST || API_CONFIG.HOST,
    NEXT_PUBLIC_API_VERSION: API_CONFIG.VERSION,
    NEXT_PUBLIC_OAUTH_WITH_GOOGLE: CONFIG.OAUTH_WITH_GOOGLE.toString(),
  },
  // Proxy all /api requests to the backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_CONFIG.HOST}/rest/:path*`, // Use configured backend URL
      },
      {
        source: '/v3/api-docs/:path*',
        destination: `${API_CONFIG.HOST}/v3/api-docs/:path*`, // Use configured backend URL
      },
      {
        source: '/swagger-ui/:path*',
        destination: `${API_CONFIG.HOST}/swagger-ui/:path*`, // Use configured backend URL
      },
    ]
  },
  // Disable direct access to backend endpoints
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
};

module.exports = nextConfig;
