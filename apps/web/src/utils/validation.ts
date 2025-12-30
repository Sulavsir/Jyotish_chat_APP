/**
 * Frontend Validation Utilities
 * Client-side validation helpers using Zod schemas
 */

import { z } from 'zod';
import type { FieldErrors } from './error-handler';

// Phone number validation (Nepali format)
const nepaliPhoneRegex = /^(98|97)\d{8}$/;

export const phoneValidation = z
  .string()
  .min(1, 'Phone number is required')
  .regex(nepaliPhoneRegex, 'Phone number must be valid Nepali number (98XXXXXXXX or 97XXXXXXXX)');

// Email validation
export const emailValidation = z.string().email('Invalid email address');

// Password validation
export const passwordValidation = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
  .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
  .regex(/(?=.*\d)/, 'Password must contain at least one number');

// Name validation
export const nameValidation = z.string().min(2, 'Name must be at least 2 characters');

// Time validation (HH:MM format)
export const timeValidation = z
  .string()
  .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)');

/**
 * Validate a single field using Zod schema
 */
export function validateField(
  schema: z.ZodSchema,
  value: any
): { valid: boolean; error?: string } {
  try {
    schema.parse(value);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0]?.message || 'Invalid value' };
    }
    return { valid: false, error: 'Validation error' };
  }
}

/**
 * Validate multiple fields using Zod schema
 */
export function validateForm<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  data: T
): { valid: boolean; errors: FieldErrors } {
  try {
    schema.parse(data);
    return { valid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: FieldErrors = {};
      error.errors.forEach((err) => {
        const field = err.path.join('.');
        fieldErrors[field] = err.message;
      });
      return { valid: false, errors: fieldErrors };
    }
    return { valid: false, errors: { _form: 'Validation error' } };
  }
}

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or phone number is required'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * OTP validation schema
 */
export const otpSchema = z.object({
  phoneNumber: phoneValidation,
});

/**
 * Verify OTP schema
 */
export const verifyOTPSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^[0-9]{6}$/, 'OTP must contain only numbers'),
});

/**
 * Set password schema
 */
export const setPasswordSchema = z
  .object({
    password: passwordValidation,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Change password schema
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordValidation,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

/**
 * Profile setup schema
 */
export const profileSetupSchema = z.object({
  name: nameValidation,
  email: emailValidation,
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  timeOfBirth: timeValidation,
  placeOfBirth: z.string().min(2, 'Place of birth is required'),
  currentAddress: z.string().min(5, 'Current address is required'),
  permanentAddress: z.string().min(5, 'Permanent address is required'),
});

/**
 * Helper to validate password strength
 */
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z\d]/.test(password)) score++;

  if (score <= 2) {
    return { score, label: 'Weak', color: 'text-red-400' };
  } else if (score <= 4) {
    return { score, label: 'Medium', color: 'text-yellow-400' };
  } else {
    return { score, label: 'Strong', color: 'text-green-400' };
  }
}

