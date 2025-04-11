const API_VERSION = 'v0.1.0';
const BASE_PATH = `/rest/${API_VERSION}`;

export const ENDPOINTS = {
  AUTH: {
    BASE: `${BASE_PATH}/auth`,
    LOGIN: `${BASE_PATH}/auth/login`,
    REGISTER: `${BASE_PATH}/auth/register`,
    LOGOUT: `${BASE_PATH}/auth/logout`,
  },
  USERS: {
    BASE: `${BASE_PATH}/users`,
    ME: `${BASE_PATH}/users/me`,
  }
};

export default ENDPOINTS;
