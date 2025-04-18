import apiClient from './apiClient';
import { ApiError } from './ApiError';
import { ENDPOINTS } from '../config';
import { jwtDecode } from 'jwt-decode';
import { logMissingTranslation } from '../utils/translationUtils';

export const loginUser = async (username, password) => {
  console.log('[authService] Starting loginUser with username:', username);
  try {
    const response = await apiClient.post(ENDPOINTS.AUTH.LOGIN, {
      username,
      password
    });
    console.log('[authService] API Response:', response);

    if (!response.data) {
      console.log('[authService] No data in response');
      logMissingTranslation('auth.login.error', 'auth');
      return {
        success: false,
        error: 'Invalid response from server'
      };
    }

    const { user, token } = response.data;
    console.log('[authService] Extracted user and token:', { user, token: token ? 'present' : 'missing' });

    if (!user || !token) {
      console.log('[authService] Missing user or token in response');
      logMissingTranslation('auth.login.error', 'auth');
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }

    // Store the token
    localStorage.setItem('jwt', token);
    console.log('[authService] Stored JWT token in localStorage');

    try {
      // Decode the JWT token to extract user information
      const decodedToken = jwtDecode(token);
      console.log('[authService] Decoded JWT token:', decodedToken);

      // Store raw values from the token
      const storedUsername = decodedToken.sub;
      const uuid = decodedToken.uuid;
      const roles = decodedToken.roles || [];
      console.log('[authService] Extracted token data:', { storedUsername, uuid, roles });

      // Store raw values in localStorage
      localStorage.setItem('username', storedUsername);
      if (uuid) localStorage.setItem('uuid', uuid);
      if (roles.length > 0) localStorage.setItem('roles', JSON.stringify(roles));
      console.log('[authService] Stored user data in localStorage');

      return {
        success: true,
        user: {
          username: storedUsername,
          uuid,
          roles
        }
      };
    } catch (decodeError) {
      console.error('[authService] Error decoding token:', decodeError);
      logMissingTranslation('auth.login.error', 'auth');
      // If decoding fails, still store the raw username
      localStorage.setItem('username', username);
      return {
        success: true,
        user: { username }
      };
    }
  } catch (error) {
    console.error('[authService] Login error:', error);

    // If we have a structured error response, use it directly
    if (error.success === false) {
      console.log('[authService] Using structured error response:', error);
      return error;
    }

    if (error.response) {
      const { status, data } = error.response;
      const errorCode = data?.errorCode || data?.code;
      console.log('[authService] Error response:', { status, data, errorCode });

      // If we have an error message, use it directly
      if (data?.errorMessage) {
        console.log('[authService] Using error message from response:', data.errorMessage);
        return {
          success: false,
          error: data.errorMessage
        };
      }

      // First check if we have a valid AuthResponse object
      if (data?.user !== null && data?.token !== null) {
        console.log('[authService] Found valid AuthResponse in error response');
        // This is a valid AuthResponse, process it
        const { user, token } = data;

        // Store the token
        localStorage.setItem('jwt', token);
        console.log('[authService] Stored JWT token from error response');

        try {
          // Decode the JWT token to extract user information
          const decodedToken = jwtDecode(token);
          console.log('[authService] Decoded JWT token from error response:', decodedToken);

          // Store raw values from the token
          const storedUsername = decodedToken.sub;
          const uuid = decodedToken.uuid;
          const roles = decodedToken.roles || [];
          console.log('[authService] Extracted token data from error response:', { storedUsername, uuid, roles });

          // Store raw values in localStorage
          localStorage.setItem('username', storedUsername);
          if (uuid) localStorage.setItem('uuid', uuid);
          if (roles.length > 0) localStorage.setItem('roles', JSON.stringify(roles));
          console.log('[authService] Stored user data from error response in localStorage');

          return {
            success: true,
            user: {
              username: storedUsername,
              uuid,
              roles
            }
          };
        } catch (decodeError) {
          console.error('[authService] Error decoding token from error response:', decodeError);
          logMissingTranslation('auth.login.error', 'auth');
          // If decoding fails, still store the raw username
          localStorage.setItem('username', username);
          return {
            success: true,
            user: { username }
          };
        }
      }
      // If not a valid AuthResponse, handle as error
      else if (errorCode) {
        console.log('[authService] Handling error with code:', errorCode);
        // For auth errors, use the auth namespace
        if (errorCode.startsWith('auth.') || errorCode === 'LOGIN_ERROR') {
          const code = errorCode === 'LOGIN_ERROR' ? 'loginError' : errorCode.split('.')[1];
          logMissingTranslation(`auth.login.${code}`, 'auth');
          return {
            success: false,
            error: data?.errorMessage || 'Login failed'
          };
        } else {
          logMissingTranslation(`api.${errorCode}`, 'api');
          return {
            success: false,
            error: data?.errorMessage || 'Request failed'
          };
        }
      }
      // If no specific error message, use status-based messages
      else if (status === 401) {
        console.log('[authService] Unauthorized (401) error');
        logMissingTranslation('auth.login.error', 'auth');
        return {
          success: false,
          error: 'Invalid username or password'
        };
      } else if (status === 403) {
        console.log('[authService] Forbidden (403) error');
        logMissingTranslation('auth.login.error', 'auth');
        return {
          success: false,
          error: 'Account is locked'
        };
      } else {
        console.log('[authService] Unhandled status code:', status);
        logMissingTranslation('auth.login.error', 'auth');
        return {
          success: false,
          error: 'Login failed'
        };
      }
    } else if (error.request) {
      console.log('[authService] No response received from server');
      return {
        success: false,
        error: 'Unable to connect to server'
      };
    } else {
      console.log('[authService] Request setup error:', error);
      return {
        success: false,
        error: 'Login request failed'
      };
    }
  }
};

export const registerUser = async (username, password, email) => {
  console.log('[authService] Starting registerUser with username:', username);

  // Validate required fields
  if (!password) {
    console.log('[authService] Password is required');
    return {
      success: false,
      error: 'Password is required'
    };
  }

  try {
    const response = await apiClient.post(ENDPOINTS.AUTH.REGISTER,
      JSON.stringify({
        username: username,
        password: password,
        email: email
      }),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('[authService] API Response:', response);

    if (!response.data) {
      console.log('[authService] No data in response');
      return {
        success: false,
        error: 'Invalid response from server'
      };
    }

    // Check for error response with user and token as null
    if (response.data.user === null && response.data.token === null && response.data.errorMessage) {
      console.log('[authService] Received error response:', response.data);
      return {
        success: false,
        error: response.data.errorMessage
      };
    }

    const { user, token } = response.data;
    console.log('[authService] Extracted user and token:', { user, token: token ? 'present' : 'missing' });

    if (!user || !token) {
      console.log('[authService] Missing user or token in response');
      return {
        success: false,
        error: 'Invalid registration data'
      };
    }

    // Store the token
    localStorage.setItem('jwt', token);
    console.log('[authService] Stored JWT token in localStorage');

    try {
      // Decode the JWT token to extract user information
      const decodedToken = jwtDecode(token);
      console.log('[authService] Decoded JWT token:', decodedToken);

      // Store raw values from the token
      const storedUsername = decodedToken.sub;
      const uuid = decodedToken.uuid;
      const roles = decodedToken.roles || [];
      console.log('[authService] Extracted token data:', { storedUsername, uuid, roles });

      // Store raw values in localStorage
      localStorage.setItem('username', storedUsername);
      if (uuid) localStorage.setItem('uuid', uuid);
      if (roles.length > 0) localStorage.setItem('roles', JSON.stringify(roles));
      console.log('[authService] Stored user data in localStorage');

      return {
        success: true,
        user: {
          username: storedUsername,
          uuid,
          roles
        }
      };
    } catch (decodeError) {
      console.error('[authService] Error decoding token:', decodeError);
      // If decoding fails, still store the raw username
      localStorage.setItem('username', username);
      return {
        success: true,
        user: { username }
      };
    }
  } catch (error) {
    console.error('[authService] Register error:', error);

    // If we have a structured error response, use it directly
    if (error.success === false) {
      console.log('[authService] Using structured error response:', error);
      return error;
    }

    if (error.response) {
      const { status, data } = error.response;
      const errorCode = data?.errorCode || data?.code;
      console.log('[authService] Error response:', { status, data, errorCode });

      // If we have an error message, use it directly
      if (data?.errorMessage) {
        console.log('[authService] Using error message from response:', data.errorMessage);
        return {
          success: false,
          error: data.errorMessage
        };
      }

      // First check if we have a valid AuthResponse object
      if (data?.user !== null && data?.token !== null) {
        console.log('[authService] Found valid AuthResponse in error response');
        // This is a valid AuthResponse, process it
        const { user, token } = data;

        // Store the token
        localStorage.setItem('jwt', token);
        console.log('[authService] Stored JWT token from error response');

        try {
          // Decode the JWT token to extract user information
          const decodedToken = jwtDecode(token);
          console.log('[authService] Decoded JWT token from error response:', decodedToken);

          // Store raw values from the token
          const storedUsername = decodedToken.sub;
          const uuid = decodedToken.uuid;
          const roles = decodedToken.roles || [];
          console.log('[authService] Extracted token data from error response:', { storedUsername, uuid, roles });

          // Store raw values in localStorage
          localStorage.setItem('username', storedUsername);
          if (uuid) localStorage.setItem('uuid', uuid);
          if (roles.length > 0) localStorage.setItem('roles', JSON.stringify(roles));
          console.log('[authService] Stored user data from error response in localStorage');

          return {
            success: true,
            user: {
              username: storedUsername,
              uuid,
              roles
            }
          };
        } catch (decodeError) {
          console.error('[authService] Error decoding token from error response:', decodeError);
          // If decoding fails, still store the raw username
          localStorage.setItem('username', username);
          return {
            success: true,
            user: { username }
          };
        }
      }
      // If not a valid AuthResponse, handle as error
      else if (errorCode) {
        console.log('[authService] Handling error with code:', errorCode);
        // For auth errors, use the auth namespace
        if (errorCode.startsWith('auth.') || errorCode === 'REGISTER_ERROR') {
          const code = errorCode === 'REGISTER_ERROR' ? 'registerError' : errorCode.split('.')[1];
          logMissingTranslation(`auth.register.${code}`, 'auth');
          return {
            success: false,
            error: data?.errorMessage || 'Registration failed'
          };
        } else {
          logMissingTranslation(`api.${errorCode}`, 'api');
          return {
            success: false,
            error: data?.errorMessage || 'Request failed'
          };
        }
      }
      // If no specific error message, use status-based messages
      else if (status === 400) {
        console.log('[authService] Bad request (400) error');
        return {
          success: false,
          error: data?.errorMessage || 'Invalid registration data'
        };
      } else if (status === 409) {
        console.log('[authService] Conflict (409) error');
        return {
          success: false,
          error: data?.errorMessage || 'Username already taken'
        };
      } else {
        console.log('[authService] Unhandled status code:', status);
        return {
          success: false,
          error: 'Registration failed'
        };
      }
    } else if (error.request) {
      console.log('[authService] No response received from server');
      return {
        success: false,
        error: 'Unable to connect to server'
      };
    } else {
      console.log('[authService] Request setup error:', error);
      return {
        success: false,
        error: 'Registration request failed'
      };
    }
  }
};

const getCurrentUser = async () => {
  try {
    const data = await apiClient(ENDPOINTS.USERS.ME, {
      method: 'GET'
    });

    if (!data) {
      logMissingTranslation('auth.login.error', 'auth');
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

export const AuthService = {
  registerUser,
  getCurrentUser,
  loginUser,
  logout,
  authenticateWithToken,
};

export default AuthService;


