/**
 * Auth Form Validation Schemas
 */

import { z } from 'zod';

// Password login schema
export const passwordLoginSchema = z.object({
  identifier: z.string().min(1, 'Email or phone number is required'),
  password: z.string().min(1, 'Password is required'),
});

export type PasswordLoginFormData = z.infer<typeof passwordLoginSchema>;

// OTP request schema
export const otpRequestSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'),
});

export type OTPRequestFormData = z.infer<typeof otpRequestSchema>;

// OTP verification schema
export const otpVerifySchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export type OTPVerifyFormData = z.infer<typeof otpVerifySchema>;

// Change password schema
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// Set password schema (for users without password)
export const setPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type SetPasswordFormData = z.infer<typeof setPasswordSchema>;

// Forgot password schema
export const forgotPasswordSchema = z
  .object({
    identifier: z.string().min(1, 'Email or phone number is required'),
  })
  .refine(
    (data) => {
      const value = data.identifier.trim();
      if (!value) return false;

      if (value.includes('@')) {
        return z
          .string()
          .email('Please enter a valid email address')
          .safeParse(value).success;
      }

      const cleaned = value.replace(/\D/g, '');
      return /^[0-9]{10}$/.test(cleaned);
    },
    {
      message: 'Must be a valid email or 10-digit phone number',
      path: ['identifier'],
    }
  );

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// Reset password with OTP schema (frontend)
export const resetPasswordWithOtpFormSchema = z
  .object({
    otp: z.string().length(6, 'OTP must be 6 digits'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type ResetPasswordWithOtpFormData = z.infer<typeof resetPasswordWithOtpFormSchema>;

export const resetPasswordWithTokenFormSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type ResetPasswordWithTokenFormData = z.infer<typeof resetPasswordWithTokenFormSchema>;

