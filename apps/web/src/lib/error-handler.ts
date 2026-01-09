/**
 * Error Handler Utilities
 * Extract error messages from API responses
 */

import { toast } from 'sonner';
import type { ApiError } from '@/types';

/**
 * Extract error message from API error response
 */
export function getErrorMessage(error: unknown): string {
  if (!error) return 'An unknown error occurred';
  
  // If it's an ApiError with a message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return (error as ApiError).message || 'An error occurred';
  }
  
  // If it's an Axios error with response data
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as any).response;
    if (response?.data?.error?.message) {
      return response.data.error.message;
    }
    if (response?.data?.message) {
      return response.data.message;
    }
  }
  
  // If it's a regular Error
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unknown error occurred';
}

/**
 * Show error toast with backend message
 */
export function showErrorToast(error: unknown, fallbackMessage = 'An error occurred') {
  const message = getErrorMessage(error) || fallbackMessage;
  toast.error(message);
}

/**
 * Show success toast with backend message
 */
export function showSuccessToast(message: string) {
  toast.success(message);
}

/**
 * Extract success message from API response
 */
export function getSuccessMessage(response: any): string {
  if (response?.message) return response.message;
  if (response?.data?.message) return response.data.message;
  return 'Success';
}

