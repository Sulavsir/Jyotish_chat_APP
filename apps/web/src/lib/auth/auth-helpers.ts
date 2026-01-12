/**
 * Auth Helper Functions
 * 
 * Utility functions for handling authentication responses and tokens
 */

import type { LoginResponse, VerifyOTPResponse, VerifyLoginOTPResponse, SetPasswordResponse } from '@/types/auth';

type AuthResponse = LoginResponse | VerifyOTPResponse | VerifyLoginOTPResponse | SetPasswordResponse;

/**
 * Extract access and refresh tokens from auth response
 * Handles both new format (accessToken/refreshToken) and legacy format (token)
 */
export function extractTokens(response: AuthResponse): {
  accessToken: string;
  refreshToken: string;
} {
  // New format - prefer accessToken and refreshToken
  if ('accessToken' in response && 'refreshToken' in response) {
    return {
      accessToken: response.accessToken as string,
      refreshToken: response.refreshToken as string,
    };
  }

  // Legacy format - use token as both access and refresh
  if ('token' in response && response.token) {
    return {
      accessToken: response.token as string,
      refreshToken: response.token as string,
    };
  }

  throw new Error('No tokens found in auth response');
}

/**
 * Check if response contains new token format
 */
export function hasNewTokenFormat(response: AuthResponse): boolean {
  return 'accessToken' in response && 'refreshToken' in response;
}




