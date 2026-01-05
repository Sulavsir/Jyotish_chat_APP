/**
 * Frontend Error Handling Utilities
 * Standardizes error handling and display across the application
 */

import { toast } from 'sonner';

export interface ApiErrorResponse {
  message: string;
  code?: string;
  fields?: Record<string, string>; // Field-level validation errors
  details?: Array<{
    field: string;
    message: string;
  }>;
  statusCode?: number;
}

export interface FieldErrors {
  [key: string]: string;
}

/**
 * Parse API error response
 * Extracts error message and field-level errors
 */
export function parseApiError(error: any): {
  message: string;
  fieldErrors: FieldErrors;
} {
  // Default error
  let message = 'An unexpected error occurred. Please try again.';
  let fieldErrors: FieldErrors = {};

  // Handle axios error response
  if (error?.response?.data) {
    const data = error.response.data;

    // Check for error object in response
    if (data?.error?.message) {
      message = data.error.message;
    } else if (data?.message) {
      message = data.message;
    }

    // Extract field-level errors
    if (data?.error?.fields) {
      fieldErrors = data.error.fields;
    } else if (data?.fields) {
      fieldErrors = data.fields;
    } else if (data?.error?.details && Array.isArray(data.error.details)) {
      data.error.details.forEach((detail: { field: string; message: string }) => {
        fieldErrors[detail.field] = detail.message;
      });
    } else if (data?.details && Array.isArray(data.details)) {
      data.details.forEach((detail: { field: string; message: string }) => {
        fieldErrors[detail.field] = detail.message;
      });
    }
  }
  // Handle direct error object (non-axios)
  else if (error?.error?.message) {
    message = error.error.message;
    if (error.error.fields) {
      fieldErrors = error.error.fields;
    }
  }
  // Handle simple error object
  else if (error?.message) {
    message = error.message;
    if (error.fields) {
      fieldErrors = error.fields;
    }
  }

  return { message, fieldErrors };
}

/**
 * Display error toast with message from backend
 * Handles 401 errors by redirecting to unauthorized page
 */
export function displayError(error: any, fallbackMessage?: string): void {
  const { message } = parseApiError(error);

  // Check various places for status code
  const statusCode = error?.response?.status || error?.statusCode || error?.status;

  // Handle 401 Unauthorized errors (but not on login pages)
  if (statusCode === 401) {
    const isLoginPage =
      typeof window !== 'undefined' &&
      (window.location.pathname.includes('/login') || window.location.pathname.includes('/auth/'));

    // Don't redirect if already on a login/auth page
    if (!isLoginPage) {
      if (typeof window !== 'undefined') {
        window.location.href = '/unauthorized';
      }
      return;
    }
  }

  toast.error(message || fallbackMessage || 'An error occurred');
}

/**
 * Check if error is unauthorized (401)
 */
export function isUnauthorizedError(error: any): boolean {
  return error?.statusCode === 401 || error?.status === 401;
}

/**
 * Display success toast
 */
export function displaySuccess(message: string): void {
  toast.success(message);
}

/**
 * Get error message from field errors
 */
export function getFieldError(fieldErrors: FieldErrors, fieldName: string): string {
  return fieldErrors[fieldName] || '';
}

/**
 * Set multiple field errors in React state
 */
export function setFieldErrors(
  fieldErrors: FieldErrors,
  setErrors: (errors: FieldErrors) => void
): void {
  setErrors(fieldErrors);
}

/**
 * Clear all field errors
 */
export function clearFieldErrors(setErrors: (errors: FieldErrors) => void): void {
  setErrors({});
}

/**
 * Clear specific field error
 */
export function clearFieldError(
  fieldName: string,
  errors: FieldErrors,
  setErrors: (errors: FieldErrors) => void
): void {
  const newErrors = { ...errors };
  delete newErrors[fieldName];
  setErrors(newErrors);
}

/**
 * Check if there are any field errors
 */
export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Validate required fields before submission
 */
export function validateRequired(data: Record<string, any>, requiredFields: string[]): FieldErrors {
  const errors: FieldErrors = {};

  requiredFields.forEach((field) => {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      errors[field] =
        `${field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} is required`;
    }
  });

  return errors;
}

/**
 * Format field name for display
 */
export function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}
