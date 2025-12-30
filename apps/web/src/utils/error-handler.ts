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

  // Handle different error formats
  if (error?.message) {
    message = error.message;
  }

  // Extract field-level errors
  if (error?.fields) {
    fieldErrors = error.fields;
  } else if (error?.details && Array.isArray(error.details)) {
    error.details.forEach((detail: { field: string; message: string }) => {
      fieldErrors[detail.field] = detail.message;
    });
  }

  return { message, fieldErrors };
}

/**
 * Display error toast with message from backend
 * Handles 401 errors by redirecting to unauthorized page
 */
export function displayError(error: any, fallbackMessage?: string): void {
  const { message } = parseApiError(error);

  // Handle 401 Unauthorized errors
  if (error?.statusCode === 401 || error?.status === 401) {
    // Redirect to unauthorized page
    if (typeof window !== 'undefined') {
      window.location.href = '/unauthorized';
    }
    return;
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
