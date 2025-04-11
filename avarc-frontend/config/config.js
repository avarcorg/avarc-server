export const API_CONFIG = {
  HOST: process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:8080',
  VERSION: process.env.NEXT_PUBLIC_API_VERSION || 'v0.1.0',
};

const BASE_PATH = `/rest/${API_CONFIG.VERSION}`;

export const ENDPOINTS = {
  AUTH: {
    BASE: `${BASE_PATH}/auth`,
    LOGIN: `${BASE_PATH}/auth/login`,
    REGISTER: `${BASE_PATH}/auth/register`,
    LOGOUT: `${BASE_PATH}/auth/logout`,
  },
  DASHBOARD: {
    BASE: `${BASE_PATH}/dashboard`,
    ME: `${BASE_PATH}/dashboard/me`,
  }
};

export const CONFIG = {
  OAUTH_WITH_GOOGLE: false, // Set to true to enable Google OAuth
};

export default {
  API_CONFIG,
  ENDPOINTS,
};
