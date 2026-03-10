/**
 * API Client - Unified axios instance with automatic token refresh
 *
 * This replaces the old fetch-based client with axios + interceptors
 * All services should use this client for automatic token refresh on 401 errors
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL, ROUTES } from '@/constants';
import { ApiResponse } from '@/types';
import { TokenManager } from '@/lib/auth';

// Track requests that are waiting for token refresh
let isRefreshing = false;
let isSessionExpired = false; // Track if session has expired to prevent loops
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
  config: AxiosRequestConfig;
}> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      // Retry the request (cookies are automatically included)
      promise.resolve(axiosInstance(promise.config));
    }
  });
  failedQueue = [];
};

// Create Axios instance with credentials support for httpOnly cookies
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // CRITICAL: Send httpOnly cookies with requests
});

// Request Interceptor - Cookies are sent automatically by browser
// No need to manually add tokens!
axiosInstance.interceptors.request.use(
  (config) => {
    // Access token is automatically sent via httpOnly cookie
    // No manual token management needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - Handle 401 errors and refresh tokens
axiosInstance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    return response;
  },
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      const requestUrl = originalRequest.url || '';

      // Don't try to refresh tokens for login/auth endpoints
      const isAuthEndpoint =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/send-otp') ||
        requestUrl.includes('/auth/verify-otp') ||
        requestUrl.includes('/auth/set-password') ||
        requestUrl.includes('/auth/refresh') ||
        requestUrl.includes('/astrologer/auth/login');

      // Don't refresh if we're on a login/auth page
      const isLoginPage =
        typeof window !== 'undefined' &&
        (window.location.pathname === ROUTES.LOGIN ||
          window.location.pathname === ROUTES.JYOTISH_LOGIN ||
          window.location.pathname.includes('/auth/') ||
          window.location.pathname.includes('/forgot-password'));

      // Skip token refresh for auth endpoints or login pages
      if (isAuthEndpoint || isLoginPage) {
        return Promise.reject(error);
      }

      // If session already expired, immediately reject and stop all requests
      if (isSessionExpired) {
        console.log('🚫 Session expired - blocking request');

        // Ensure redirect happens (might have been blocked)
        if (
          typeof window !== 'undefined' &&
          window.location.pathname !== ROUTES.LOGIN &&
          window.location.pathname !== ROUTES.JYOTISH_LOGIN &&
          !window.location.pathname.includes('/auth/') &&
          !window.location.pathname.includes('/forgot-password')
        ) {
          const isAstrologerRoute = window.location.pathname.startsWith('/jyotish');
          const loginRoute = isAstrologerRoute ? ROUTES.JYOTISH_LOGIN : ROUTES.LOGIN;
          setTimeout(() => window.location.replace(loginRoute), 0);
        }

        return Promise.reject(new Error('Session expired'));
      }

      // Prevent infinite loops
      originalRequest._retry = true;

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      isRefreshing = true;

      try {
        // Call refresh endpoint
        // NOTE: Both tokens are automatically sent/received via httpOnly cookies
        await axios.post(
          `${API_BASE_URL}/api/v1/auth/refresh`,
          {},
          { withCredentials: true } // Send cookies
        );

        // Cookies are automatically updated by server
        // No need to manually update tokens

        // Reset session expired flag on successful refresh
        isSessionExpired = false;

        // Process queued requests
        processQueue(null);

        // Retry the original request (with new cookies)
        return axiosInstance(originalRequest);
      } catch (refreshError: any) {
        // Mark session as expired to prevent further refresh attempts
        isSessionExpired = true;

        console.log(
          '❌ Token refresh failed:',
          refreshError?.response?.data?.error || refreshError?.message
        );

        // Refresh failed - clear local storage and redirect to login
        processQueue(new Error('Session expired'));
        TokenManager.clearTokens();

        // Clear auth store completely
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('jyotish-auth');
            localStorage.removeItem('jyotish-store');
            console.log('✅ Cleared localStorage');
          } catch (e) {
            console.error('Error clearing localStorage:', e);
          }
        }

        // Determine which login page to redirect to
        const isAstrologerRoute =
          typeof window !== 'undefined' && window.location.pathname.startsWith('/jyotish');
        const loginRoute = isAstrologerRoute ? ROUTES.JYOTISH_LOGIN : ROUTES.LOGIN;

        // Force redirect immediately
        if (
          typeof window !== 'undefined' &&
          window.location.pathname !== ROUTES.LOGIN &&
          window.location.pathname !== ROUTES.JYOTISH_LOGIN &&
          !window.location.pathname.includes('/auth/') &&
          !window.location.pathname.includes('/forgot-password')
        ) {
          console.log('🔄 Forcing redirect to login:', loginRoute);

          // Use setTimeout to ensure this happens after current execution
          setTimeout(() => {
            window.location.replace(loginRoute);
          }, 100);
        }

        return Promise.reject(new Error('Session expired'));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Extract user-friendly error message from axios error
 */
function getErrorMessage(error: any): string {
  // If it's an axios error with a response from our backend
  if (error.response?.data) {
    const data = error.response.data;

    // Our standard error format: { success: false, error: { message, code } }
    if (data.error?.message) {
      return data.error.message;
    }

    // Legacy format: { message }
    if (data.message) {
      return data.message;
    }

    // Validation errors with details
    if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors.map((e: any) => e.message || e).join(', ');
    }
  }

  // Network or timeout errors
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return 'Request timed out. Please try again.';
  }

  if (error.message === 'Network Error') {
    return 'Network error. Please check your connection.';
  }

  // Fallback to error message or generic message
  return error.message || 'An unexpected error occurred. Please try again.';
}

// Wrapper class to maintain backward compatibility with old API
class ApiClient {
  async get<T>(endpoint: string, options?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await axiosInstance.get<ApiResponse<T>>(endpoint, options);
      return response.data.data !== undefined ? response.data.data : (response.data as any);
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  async post<T>(endpoint: string, data?: any, includeAuth = true): Promise<T> {
    try {
      const config: AxiosRequestConfig = includeAuth
        ? {}
        : {
            headers: { Authorization: '' },
          };
      const response = await axiosInstance.post<ApiResponse<T>>(endpoint, data, config);
      return response.data.data !== undefined ? response.data.data : (response.data as any);
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await axiosInstance.put<ApiResponse<T>>(endpoint, data);
      return response.data.data !== undefined ? response.data.data : (response.data as any);
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await axiosInstance.patch<ApiResponse<T>>(endpoint, data);
      return response.data.data !== undefined ? response.data.data : (response.data as any);
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  async delete<T>(endpoint: string): Promise<T> {
    try {
      const response = await axiosInstance.delete<ApiResponse<T>>(endpoint);
      return response.data.data !== undefined ? response.data.data : (response.data as any);
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
    try {
      const token = TokenManager.getAccessToken();
      const headers: any = {
        'Content-Type': 'multipart/form-data',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await axiosInstance.post<ApiResponse<T>>(endpoint, formData, { headers });
      return response.data.data !== undefined ? response.data.data : (response.data as any);
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }
}

export const apiClient = new ApiClient();
export { axiosInstance }; 
