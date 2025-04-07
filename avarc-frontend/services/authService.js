import { apiClient, ApiError } from './apiClient';

const AUTH_ENDPOINT = '/rest/v0.1.0/auth';

const loginUser = async (username, password) => {
  try {
    const data = await apiClient(`${AUTH_ENDPOINT}/login`, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    localStorage.setItem('jwt', data.token);
    localStorage.setItem('username', username);
    return data;
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
    const data = await apiClient(`${AUTH_ENDPOINT}/register`, {
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
    return await apiClient(`${AUTH_ENDPOINT}/me`, {
      method: 'GET'
    });
  } catch (error) {
    // Simply reject the promise with the error, no redirects
    return Promise.reject(error);
  }
};

const logout = async () => {
  try {
    await apiClient(`${AUTH_ENDPOINT}/logout`, {
      method: 'POST'
    });
  } finally {
    localStorage.removeItem('jwt');
    localStorage.removeItem('username');
  }
};

export const AuthService = {
  loginUser,
  registerUser,
  getCurrentUser,
  logout
};

export default AuthService;
