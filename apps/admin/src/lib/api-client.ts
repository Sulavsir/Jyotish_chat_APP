/**
 * API Client for Admin Panel
 * Handles all HTTP requests with authentication
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/constants/api.constants';

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private isSessionExpired = false; // Track if session has expired to prevent loops
  private failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 25_000, // Fail fast in production; avoid long pending states
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Important for httpOnly cookies
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Response interceptor for handling token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          const requestUrl = originalRequest.url || '';

          // Don't try to refresh for login/auth endpoints
          const isAuthEndpoint =
            requestUrl.includes('/auth/login') || requestUrl.includes('/auth/refresh');

          // Don't refresh if we're on login page
          const isLoginPage =
            typeof window !== 'undefined' &&
            (window.location.pathname === '/admin/login' || window.location.pathname === '/login');

          if (isAuthEndpoint || isLoginPage) {
            return Promise.reject(error);
          }

          // If session already expired, redirect immediately
          if (this.isSessionExpired) {
            console.log('🚫 Admin session expired - redirecting to login');
            return Promise.reject(error);
          }

          if (this.isRefreshing) {
            // Wait for the refresh to complete
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => {
                return this.client(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            // Attempt to refresh the token
            await this.client.post('/api/v1/admin/auth/refresh');

            // Reset session expired flag on successful refresh
            this.isSessionExpired = false;

            // Process failed queue
            this.failedQueue.forEach(({ resolve }) => resolve());
            this.failedQueue = [];

            // Retry the original request
            return this.client(originalRequest);
          } catch (refreshError: any) {
            // Mark session as expired to prevent further attempts
            this.isSessionExpired = true;

            console.log(
              '❌ Admin token refresh failed:',
              refreshError?.response?.data?.error || refreshError?.message
            );

            // Refresh failed, reject all queued requests
            this.failedQueue.forEach(({ reject }) => reject(new Error('Session expired')));
            this.failedQueue = [];

            // Clear admin store
            if (typeof window !== 'undefined') {
              try {
                const adminStore = localStorage.getItem('admin-storage');
                if (adminStore) {
                  localStorage.removeItem('admin-storage');
                }
              } catch (e) {
                console.error('Error clearing admin store:', e);
              }

              // Redirect to login using replace to prevent back button issues
              console.log('🔄 Redirecting to admin login');
              window.location.replace('/admin/login');
            }

            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Extract user-friendly error message from axios error
   */
  private getErrorMessage(error: any): string {
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

  async get<T>(url: string, config?: any): Promise<T> {
    try {
      const response = await this.client.get(url, config);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    try {
      const response = await this.client.post(url, data, config);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    try {
      const response = await this.client.put(url, data, config);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    try {
      const response = await this.client.patch(url, data, config);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    try {
      const response = await this.client.delete(url, config);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Upload file (multipart/form-data)
   */
  async uploadFile<T>(url: string, formData: FormData, config?: any): Promise<T> {
    try {
      const response = await this.client.post(url, formData, {
        ...(config || {}),
        headers: {
          ...(config?.headers || {}),
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }
}

export const apiClient = new ApiClient();
