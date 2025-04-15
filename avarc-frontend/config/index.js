// API Configuration
const API_CONFIG = {
  HOST: process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:8080',
  VERSION: process.env.NEXT_PUBLIC_API_VERSION || 'v0.1.0',
};

// Base path for all endpoints
const BASE_PATH = `/rest/${API_CONFIG.VERSION}`;

// All API endpoints
const ENDPOINTS = {
  AUTH: {
    BASE: `${BASE_PATH}/auth`,
    LOGIN: `${BASE_PATH}/auth/login`,
    REGISTER: `${BASE_PATH}/auth/register`,
    LOGOUT: `${BASE_PATH}/auth/logout`,
  },
  USERS: {
    BASE: `${BASE_PATH}/users`,
    ME: `${BASE_PATH}/users/me`,
  },
  DASHBOARD: {
    BASE: `${BASE_PATH}/dashboard`,
    ME: `${BASE_PATH}/dashboard/me`,
  }
};

// Feature flags and other configuration
const CONFIG = {
  OAUTH_WITH_GOOGLE: process.env.NEXT_PUBLIC_OAUTH_WITH_GOOGLE === 'true',
};

// Export everything
module.exports = {
  API_CONFIG,
  ENDPOINTS,
  CONFIG,
};
