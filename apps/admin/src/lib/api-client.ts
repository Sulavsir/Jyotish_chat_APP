/**
 * API Client for Admin Panel
 * Handles all HTTP requests with authentication
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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
          const isAuthEndpoint = requestUrl.includes('/auth/login') || 
                                requestUrl.includes('/auth/refresh');
          
          // Don't refresh if we're on login page
          const isLoginPage = typeof window !== 'undefined' && 
                             (window.location.pathname === '/admin/login' ||
                              window.location.pathname === '/login');
          
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

            console.log('❌ Admin token refresh failed:', refreshError?.response?.data?.error || refreshError?.message);

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

  async get<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data.data || response.data;
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data.data || response.data;
  }

  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data.data || response.data;
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.patch(url, data, config);
    return response.data.data || response.data;
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data.data || response.data;
  }
}

export const apiClient = new ApiClient();


