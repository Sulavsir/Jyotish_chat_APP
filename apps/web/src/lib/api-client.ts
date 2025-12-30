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

        // Process queued requests
        processQueue(null);

        // Retry the original request (with new cookies)
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear local storage and redirect to login
        processQueue(new Error('Token refresh failed'));
        TokenManager.clearTokens();

        // Only redirect if not already on login page
        if (typeof window !== 'undefined' && window.location.pathname !== ROUTES.LOGIN) {
          window.location.href = ROUTES.LOGIN;
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Wrapper class to maintain backward compatibility with old API
class ApiClient {
  async get<T>(endpoint: string, options?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.get<ApiResponse<T>>(endpoint, options);
    return response.data.data !== undefined ? response.data.data : (response.data as any);
  }

  async post<T>(endpoint: string, data?: any, includeAuth = true): Promise<T> {
    const config: AxiosRequestConfig = includeAuth
      ? {}
      : {
          headers: { Authorization: '' },
        };
    const response = await axiosInstance.post<ApiResponse<T>>(endpoint, data, config);
    return response.data.data !== undefined ? response.data.data : (response.data as any);
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await axiosInstance.put<ApiResponse<T>>(endpoint, data);
    return response.data.data !== undefined ? response.data.data : (response.data as any);
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const response = await axiosInstance.patch<ApiResponse<T>>(endpoint, data);
    return response.data.data !== undefined ? response.data.data : (response.data as any);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await axiosInstance.delete<ApiResponse<T>>(endpoint);
    return response.data.data !== undefined ? response.data.data : (response.data as any);
  }

  async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
    const token = TokenManager.getAccessToken();
    const headers: any = {
      'Content-Type': 'multipart/form-data',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await axiosInstance.post<ApiResponse<T>>(endpoint, formData, { headers });
    return response.data.data !== undefined ? response.data.data : (response.data as any);
  }
}

export const apiClient = new ApiClient();
export { axiosInstance };
