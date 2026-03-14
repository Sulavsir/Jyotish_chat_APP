/**
 * Auth validators - password reset, Google OAuth, and related
 * Defined in API so routes work without depending on shared package build.
 */

import { z } from 'zod';

// ─── Google OAuth Validators ───────────────────────────────────────────────

/**
 * Validator for Google mobile login (Flutter)
 * Expects an ID token from google_sign_in package
 */
export const googleMobileLoginSchema = z.object({
  idToken: z
    .string()
    .min(1, 'ID token is required')
    .refine(
      (token) => token.split('.').length === 3,
      'Invalid ID token format (expected JWT)'
    ),
});

export type GoogleMobileLoginInput = z.infer<typeof googleMobileLoginSchema>;

// ─── Phone / Password Validators ───────────────────────────────────────────

const nepaliPhoneRegex = /^(98|97)\d{8}$/;
const phoneValidation = z
  .string()
  .min(1, 'Phone number is required')
  .regex(
    nepaliPhoneRegex,
    'Phone number must be a valid 10-digit Nepali number (98XXXXXXXX or 97XXXXXXXX)'
  );

const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
  .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
  .regex(/(?=.*\d)/, 'Password must contain at least one number');

export const forgotPasswordSchema = z
  .object({
    identifier: z.string().min(1, 'Email or phone number is required'),
  })
  .refine(
    (data) => {
      const value = data.identifier.trim();
      if (!value) return false;
      if (value.includes('@')) {
        return z.string().email().safeParse(value).success;
      }
      const cleaned = value.replace(/\D/g, '');
      return nepaliPhoneRegex.test(cleaned);
    },
    {
      message: 'Must be a valid email or Nepali phone number',
      path: ['identifier'],
    }
  );

export const resetPasswordWithTokenSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const verifyPasswordResetOtpSchema = z.object({
  phoneNumber: phoneValidation,
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^[0-9]{6}$/, 'OTP must contain only numbers'),
  sessionId: z.string().uuid('Invalid session ID'),
});

export const resetPasswordWithOtpSchema = z
  .object({
    phoneNumber: phoneValidation,
    otp: z
      .string()
      .length(6, 'OTP must be 6 digits')
      .regex(/^[0-9]{6}$/, 'OTP must contain only numbers'),
    sessionId: z.string().uuid('Invalid session ID'),
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
