export interface CheckPhoneRequest {
  phoneNumber: string;
}

export interface CheckPhoneResponse {
  success: boolean;
  exists: boolean;
  message: string;
}

export interface SendOTPRequest {
  phoneNumber: string;
  role?: string; // Optional: ASTROLOGER for astrologer registration
}

export interface SendOTPResponse {
  success: boolean;
  message: string;
  sessionId: string;
  isExistingUser?: boolean;
  otp?: string; // Only in development
}

export interface VerifyOTPRequest {
  phoneNumber: string;
  otp: string;
  sessionId: string;
  role?: string; // Optional: ASTROLOGER for astrologer registration
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  isNewUser: boolean;
  // Tokens are stored as httpOnly cookies - not returned in response
  // User details must be fetched via /api/v1/users/me
}

export interface SetPasswordRequest {
  tempToken: string;
  password: string;
  confirmPassword: string;
}

export interface SetPasswordResponse {
  success: boolean;
  message: string;
  // Tokens are stored as httpOnly cookies - not returned in response
  // User details must be fetched via /api/v1/users/me
}

export interface LoginRequest {
  identifier: string; // Can be email or phone
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  // Tokens are stored as httpOnly cookies - not returned in response
  // User details must be fetched via /api/v1/users/me
}

export interface LoginWithOTPRequest {
  phoneNumber: string;
}

export interface LoginWithOTPResponse {
  success: boolean;
  message: string;
  sessionId: string;
  otp?: string; // Only in development
}

export interface VerifyLoginOTPRequest {
  phoneNumber: string;
  otp: string;
  sessionId: string;
}

export interface VerifyLoginOTPResponse {
  success: boolean;
  message: string;
  // Tokens are stored as httpOnly cookies - not returned in response
  // User details must be fetched via /api/v1/users/me
}

export interface User {
  id: string;
  phoneNumber: string;
  email?: string;
  name?: string;
  role?: string;
  profilePhoto?: string;
  dateOfBirth?: string;
  timeOfBirth?: string;
  placeOfBirth?: string;
  currentAddress?: string;
  permanentAddress?: string;
  zodiacSign?: string;
  profileCompleted: boolean;
  hasPassword: boolean; // Flag to indicate if user has set a password
  createdAt: string;
  updatedAt: string;
}

export interface ProfileSetupRequest {
  name: string;
  email: string;
  dateOfBirth: string; // YYYY-MM-DD
  timeOfBirth: string; // HH:MM (24-hour format)
  placeOfBirth: string;
  currentAddress: string;
  permanentAddress: string;
  profilePhoto?: File;
}

export interface ProfileSetupResponse {
  success: boolean;
  message: string;
  user: User;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}
