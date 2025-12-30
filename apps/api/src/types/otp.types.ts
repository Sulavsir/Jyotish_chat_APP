/**
 * OTP Type Definitions
 */

export interface OTPSession {
  id: string;
  phoneNumber: string;
  otp: string;
  expiresAt: Date;
  verified: boolean;
  attempts: number;
  createdAt: Date;
}

export interface SendOTPResult {
  sessionId: string;
  isExistingUser: boolean;
  otp?: string; // Only for development
}

export interface VerifyOTPResult {
  success: boolean;
  phoneNumber: string;
}

