import { API_CONFIG } from '../config';
import { ApiError } from './ApiError';

export const apiClient = async (endpoint, options = {}) => {
  const token = localStorage.getItem('jwt');
  const language = localStorage.getItem('language') || 'en';

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'X-Language': language,
    ...(token && { 'Authorization': `Bearer ${token}` })
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(`${API_CONFIG.HOST}${endpoint}`, config);
  const responseData = response.status !== 204 ?
    await response.json().catch(() => ({})) : {};

  if (!response.ok) {
    // Remove automatic redirect for 401
    if (response.status === 401) {
      localStorage.removeItem('jwt');
      localStorage.removeItem('username');
    }

    const errorMessage = responseData.message ||
                        responseData.error ||
                        responseData.error_message ||
                        responseData.errorMessage ||
                        'API request failed';

    const error = new ApiError(
      errorMessage,
      response.status,
      responseData
    );
    return Promise.reject(error);
  }

  return responseData;
};
