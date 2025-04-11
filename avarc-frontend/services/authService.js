import { apiClient, ApiError } from './apiClient';
import { ENDPOINTS } from '../config/endpoints';
import { jwtDecode } from 'jwt-decode';

const loginUser = async (username, password) => {
  try {
    const data = await apiClient(ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (!data || !data.token) {
      throw new ApiError('Invalid response from server', 500);
    }

    // Store the token
    localStorage.setItem('jwt', data.token);

    try {
      // Decode the JWT token to extract user information
      const decodedToken = jwtDecode(data.token);
      const storedUsername = decodedToken.sub || username;
      const uuid = decodedToken.uuid;
      const roles = decodedToken.roles || [];

      // Store user information in localStorage
      localStorage.setItem('username', storedUsername);
      if (uuid) localStorage.setItem('uuid', uuid);
      if (roles.length > 0) localStorage.setItem('roles', JSON.stringify(roles));

      return {
        success: true,
        user: {
          username: storedUsername,
          uuid,
          roles
        }
      };
    } catch (decodeError) {
      console.error('Failed to decode JWT:', decodeError);
      // If decoding fails, still store the token and username
      localStorage.setItem('username', username);
      return {
        success: true,
        user: { username }
      };
    }
  } catch (error) {
    if (error instanceof ApiError) {
      return Promise.reject(error);
    }
    return Promise.reject(new ApiError('Login failed. Please try again.', error.status));
  }
};

const registerUser = async (username, password) => {
  try {
    const data = await apiClient(ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify({
        username: username,
        password: password
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!data || !data.token) {
      throw new ApiError('Registration failed', 500);
    }

    // Store the token from registration response
    localStorage.setItem('jwt', data.token);

    try {
      // Decode the JWT token to extract user information
      const decodedToken = jwtDecode(data.token);
      const storedUsername = decodedToken.sub || username;
      const uuid = decodedToken.uuid;
      const roles = decodedToken.roles || [];

      // Store user information in localStorage
      localStorage.setItem('username', storedUsername);
      if (uuid) localStorage.setItem('uuid', uuid);
      if (roles.length > 0) localStorage.setItem('roles', JSON.stringify(roles));

      return {
        success: true,
        user: {
          username: storedUsername,
          uuid,
          roles
        }
      };
    } catch (decodeError) {
      console.error('Failed to decode JWT:', decodeError);
      // If decoding fails, still store the token and username
      localStorage.setItem('username', username);
      return {
        success: true,
        user: { username }
      };
    }
  } catch (error) {
    if (error instanceof ApiError) {
      return Promise.reject(error);
    }
    return Promise.reject(new ApiError('Registration failed. Please try again.', 0));
  }
};

const getCurrentUser = async () => {
  try {
    const data = await apiClient(ENDPOINTS.USERS.ME, {
      method: 'GET'
    });

    if (!data) {
      throw new ApiError('Failed to fetch user data', 500);
    }

    return data;
  } catch (error) {
    return Promise.reject(error);
  }
};

const authenticateWithToken = async (token) => {
  try {
    const user = await getCurrentUser();
    return user;
  } catch (error) {
    if (error.status === 401) {
      // Clear auth data on authentication error
      localStorage.removeItem('jwt');
      localStorage.removeItem('username');
      localStorage.removeItem('uuid');
      localStorage.removeItem('roles');
    }
    return Promise.reject(error);
  }
};

const logout = async () => {
  try {
    await apiClient(ENDPOINTS.AUTH.LOGOUT, {
      method: 'POST'
    });
  } finally {
    localStorage.removeItem('jwt');
    localStorage.removeItem('username');
    localStorage.removeItem('uuid');
    localStorage.removeItem('roles');
  }
};

export { loginUser, logout };

export const AuthService = {
  registerUser,
  getCurrentUser,
  loginUser,
  logout,
  authenticateWithToken,
};

export default AuthService;
