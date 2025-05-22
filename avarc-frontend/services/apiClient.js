import axios from 'axios';
import { logMissingTranslation } from '../utils/translationUtils';

const apiClient = axios.create({
    // Use relative URLs that will be handled by Next.js API routes
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to set dynamic headers
apiClient.interceptors.request.use(
    (config) => {
        // TODO: Disable detailed logging in production
        // Log request details including the full URL that will be used
        console.log('[apiClient] Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            baseURL: config.baseURL,
            connectionURL: `${config.baseURL}${config.url}`, // The actual URL that will be used for the connection
            headers: config.headers,
            data: config.data
        });

        // Only access localStorage on the client side
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('jwt');
            const language = localStorage.getItem('language') || 'en';

            config.headers['X-Language'] = language;
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return config;
    },
    (error) => {
        console.error('[apiClient] Request Error:', error);
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => {
        // Log response details
        console.log('[apiClient] Response:', {
            status: response.status,
            statusText: response.statusText,
            url: response.config.url,
            method: response.config.method?.toUpperCase(),
            headers: response.headers,
            data: response.data
        });

        // Check for error_code in successful responses
        if (response.data?.error_code) {
            const error = new Error();
            error.response = {
                status: 200,
                data: {
                    code: response.data.error_code,
                    message: response.data.message
                }
            };
            return Promise.reject(error);
        }
        return response;
    },
    (error) => {
        // Log error details
        console.error('[apiClient] Error:', {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: error.config?.url,
            method: error.config?.method?.toUpperCase(),
            headers: error.config?.headers,
            data: error.response?.data,
            config: error.config
        });

        // If the error already has a success property, it's already been handled by authService
        if (error.success !== undefined) {
            console.log('[apiClient] Error already handled, passing through:', error);
            // Return the error directly without any processing
            return Promise.reject(error);
        }

        let apiError;

        try {
            if (error.response) {
                // Handle API error response
                apiError = {
                    success: false,
                    error: error.response.data?.message || 'api.requestFailed',
                    status: error.response.status,
                    data: error.response.data
                };

                // Log detailed information about the API error response
                console.log('[apiClient] API Error Response:', {
                    status: error.response.status,
                    data: error.response.data,
                    headers: error.response.headers,
                    config: error.response.config
                });

                // Handle specific HTTP status codes
                switch (error.response.status) {
                    case 401:
                        apiError.error = 'api.unauthorized';
                        break;
                    case 403:
                        apiError.error = 'api.forbidden';
                        break;
                    case 404:
                        apiError.error = 'api.notFound';
                        break;
                    case 500:
                        apiError.error = 'api.serverError';
                        break;
                    case 400:
                        // Use the error message directly from the API for 400 errors
                        apiError.error = error.response.data?.message || 'api.requestFailed';
                        break;
                }

                // Check if this is an auth response with a valid AuthResponse object
                if (error.config?.url?.includes('/auth/') &&
                    error.response.status === 400 &&
                    error.response.data?.user !== null &&
                    error.response.data?.token !== null) {
                    console.log('[apiClient] Valid AuthResponse detected, passing through');
                    return error.response;
                }

                const errorCode = error.response.data?.code || error.response.data?.error_code || error.response.data?.errorCode;
                const errorMessage = error.response.data?.message || error.response.data?.errorMessage;

                console.log('[apiClient] Extracted error details:', {
                    errorCode,
                    errorMessage,
                    url: error.config?.url
                });

                // Create a new error with stack trace
                apiError.stack = new Error().stack;

                // For registration errors, use the error message directly
                if (error.config?.url?.includes('/auth/register') && error.response.status === 400) {
                    console.log('[apiClient] Registration error detected, returning original message:', errorMessage);
                    return Promise.reject({
                        success: false,
                        error: errorMessage || 'Registration failed'
                    });
                }

                // Always use the error message from the API if available
                if (errorMessage) {
                    console.log('[apiClient] Using error message from API:', errorMessage);
                    apiError.error = errorMessage;
                } else if (errorCode) {
                    console.log('[apiClient] Processing error code:', errorCode);
                    // For auth errors, use the auth namespace
                    if (errorCode.startsWith('auth.') || errorCode === 'LOGIN_ERROR' || errorCode === 'REGISTER_ERROR') {
                        const endpoint = error.config?.url?.split('/').pop() || 'login';
                        // Only log missing translation for known error codes without spaces
                        if (!errorCode.includes(' ')) {
                            console.log('[apiClient] Logging missing translation for auth error:', `auth.${endpoint}.error`);
                            logMissingTranslation(`auth.${endpoint}.error`, 'auth');
                        }
                        apiError.error = 'Authentication failed. Please try again.';
                    } else {
                        // Only log missing translation for known error codes without spaces
                        if (!errorCode.includes(' ')) {
                            console.log('[apiClient] Logging missing translation for API error:', `api.${errorCode}`);
                            logMissingTranslation(`api.${errorCode}`, 'api');
                        }
                        apiError.error = 'Request failed';
                    }
                } else if (error.response.status === 401) {
                    console.log('Processing 401 error');
                    // For 401 errors, check if it's an auth attempt
                    const isAuthAttempt = error.config?.url?.includes('/auth/');
                    if (isAuthAttempt) {
                        apiError.error = 'Invalid credentials';
                    } else {
                        console.log('Logging missing translation for unauthorized error');
                        logMissingTranslation('api.unauthorized', 'api');
                        apiError.error = 'Unauthorized access';
                    }

                    // Only clear auth data on the client side
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('jwt');
                        localStorage.removeItem('username');
                        localStorage.removeItem('uuid');
                        localStorage.removeItem('roles');
                    }
                } else if (error.response.status === 403) {
                    console.log('Processing 403 error');
                    logMissingTranslation('api.forbidden', 'api');
                    apiError.error = 'Access forbidden';
                } else if (error.response.status === 404) {
                    console.log('Processing 404 error');
                    logMissingTranslation('api.notFound', 'api');
                    apiError.error = 'Resource not found';
                } else if (error.response.status >= 500) {
                    console.log('Processing 500+ error');
                    logMissingTranslation('api.serverError', 'api');
                    apiError.error = 'Server error occurred';
                } else {
                    console.log('Processing unknown error');
                    logMissingTranslation('api.unknownError', 'api');
                    apiError.error = 'An unknown error occurred';
                }
            } else if (error.request) {
                console.log('[apiClient] No response received from server');
                // The request was made but no response was received
                apiError = new Error('Unable to connect to server');
            } else {
                console.log('[apiClient] Request setup error:', error);
                // Something happened in setting up the request that triggered an Error
                apiError = new Error('Request failed');
            }
        } catch (err) {
            console.error('[apiClient] Error in API client interceptor:', err);
            apiError = new Error('An unexpected error occurred');
        }

        console.log('[apiClient] Final error being returned:', {
            success: false,
            error: apiError.error
        });

        // Return a rejected promise with the error
        return Promise.reject(apiError);
    }
);

export default apiClient;
