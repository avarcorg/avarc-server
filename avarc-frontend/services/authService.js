import { apiClient, ApiError } from './apiClient';
import { ENDPOINTS } from '../config/endpoints';
import { jwtDecode } from 'jwt-decode';

const loginUser = async (username, password) => {
  try {
    const data = await apiClient(ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    const token = data.token;
    localStorage.setItem('jwt', token);

    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        // Extract user information from the token
        const storedUsername = decodedToken.sub || username;
        const uuid = decodedToken.uuid;
        const roles = decodedToken.roles || [];

        // Store user information in localStorage
        localStorage.setItem('username', storedUsername);
        localStorage.setItem('uuid', uuid);
        localStorage.setItem('roles', JSON.stringify(roles));

        // Return the complete user information
        return {
          ...data,
          user: {
            username: storedUsername,
            uuid,
            roles
          }
        };
      } catch (decodeError) {
        console.error('Failed to decode JWT:', decodeError);
        // If decoding fails, still store the token and username, but clear other data
        localStorage.setItem('username', username);
        localStorage.removeItem('uuid');
        localStorage.removeItem('roles');
        return data;
      }
    } else {
      // Handle cases where token might be missing in the response
      localStorage.setItem('username', username);
      localStorage.removeItem('uuid');
      localStorage.removeItem('roles');
      return data;
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 400) {
      // For login errors, we want to pass them through to the UI
      return Promise.reject(error);
    }
    // For other errors, we might want to standardize the message
    return Promise.reject(new ApiError('Login failed. Please try again.', error.status));
  }
};

const registerUser = async (username, password) => {
  try {
    const data = await apiClient(ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (data && data.success) {
      // Return the success data first so UI can show message
      await new Promise(resolve => setTimeout(resolve, 10000));
      try {
        return await loginUser(username, password);
      } catch (loginError) {
        // If login fails after registration, still return success
        return data;
      }
    }
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      return Promise.reject(error);
    }
    return Promise.reject(new ApiError('Registration failed. Please try again.', 0));
  }
};

const getCurrentUser = async () => {
  try {
    return await apiClient(ENDPOINTS.DASHBOARD.ME, {
      method: 'GET'
    });
  } catch (error) {
    // Simply reject the promise with the error, no redirects
    return Promise.reject(error);
  }
};

const authenticateWithToken = async (token) => {
  // apiClient likely already uses the token from localStorage.
  // If not, you might need to pass the token explicitly to apiClient here.
  // For now, we assume apiClient handles the token automatically.
  // We might pass the token argument for future flexibility or if apiClient needs it.
  try {
    // Re-use getCurrentUser logic as it fetches user data based on the token
    const user = await getCurrentUser();
    // Optionally, you could verify if the returned user data is valid
    // or if the token needs refreshing based on the API response
    return user;
  } catch (error) {
    // If getCurrentUser fails (e.g., token invalid/expired), reject the promise
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
