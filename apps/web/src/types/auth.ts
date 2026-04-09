/**
 * Auth-related type definitions for frontend
 */

import type { User, UserRole } from '@jyotish/shared';

// Re-export User type for convenience
export type { User };

// API Error type
export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
  statusCode?: number;
}

// Check Phone
export interface CheckPhoneRequest {
  phoneNumber: string;
}

export interface CheckPhoneResponse {
  exists: boolean;
  message: string;
}

// Send OTP
export interface SendOTPRequest {
  phoneNumber: string;
  role?: UserRole;
}

export interface SendOTPResponse {
  sessionId: string;
  isExistingUser: boolean;
  message: string;
  expiresIn: number; // OTP expiry time in seconds (5 minutes = 300 seconds)
  otp?: string; // Only in development mode
}

// Verify OTP
export interface VerifyOTPRequest {
  sessionId: string;
  phoneNumber: string;
  otp: string;
  role?: UserRole;
}

export interface VerifyOTPResponse {
  isNewUser: boolean;
  message: string;
  tempToken: string;
}

// Set Password
export interface SetPasswordRequest {
  phoneNumber: string;
  tempToken: string;
  password: string;
  confirmPassword: string;
}

export interface SetPasswordResponse {
  message: string;
}

// Login with Email/Phone and Password
export interface LoginRequest {
  identifier: string; // email or phone
  password: string;
}

export interface LoginResponse {
  message: string;
}

// Login with OTP (send OTP)
export interface LoginWithOTPRequest {
  phoneNumber: string;
}

export interface LoginWithOTPResponse {
  message: string;
  expiresIn: number;
}

// Verify Login OTP
export interface VerifyLoginOTPRequest {
  phoneNumber: string;
  otp: string;
}

export interface VerifyLoginOTPResponse {
  message: string;
}

// Profile Setup
export interface ProfileSetupRequest {
  name: string;
  email?: string;
  dateOfBirth?: string;
  timeOfBirth?: string;
  placeOfBirth?: string;
  latitude?: number;
  longitude?: number;
  profilePhoto?: File;
}

export interface ProfileSetupResponse {
  user: User;
  message: string;
}

// Forgot / Reset Password
export interface ForgotPasswordRequest {
  identifier: string;
}

export interface ForgotPasswordResponse {
  method: 'email' | 'otp' | 'none';
  message: string;
  sessionId?: string;
  expiresIn?: number;
  phoneNumber?: string;
  otp?: string;
}

export interface ResetPasswordWithTokenRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ResetPasswordWithTokenResponse {
  message: string;
}

export interface ResetPasswordWithOtpRequest {
  phoneNumber: string;
  otp: string;
  sessionId: string;
  password: string;
  confirmPassword: string;
}

export interface ResetPasswordWithOtpResponse {
  message: string;
}

// Get Current User
export interface GetProfileResponse {
  user: User;
}
