/**
 * OAuth-related API path segments (relative to origin).
 * Use from web (`API_ENDPOINTS`) and native apps (Flutter / React Native) for a single source of truth.
 */
export const AUTH_OAUTH_API_PATHS = {
  GOOGLE_LOGIN: '/api/v1/auth/google/login',
  GOOGLE_CALLBACK: '/api/v1/auth/google/callback',
  GOOGLE_VERIFY_TOKEN: '/api/v1/auth/google/verify-token',
  GOOGLE_MOBILE: '/api/v1/auth/google/mobile',
  FACEBOOK_LOGIN: '/api/v1/auth/facebook/login',
  FACEBOOK_CALLBACK: '/api/v1/auth/facebook/callback',
  FACEBOOK_VERIFY_TOKEN: '/api/v1/auth/facebook/verify-token',
  FACEBOOK_MOBILE: '/api/v1/auth/facebook/mobile',
  APPLE_VERIFY_TOKEN: '/api/v1/auth/apple/verify-token',
  APPLE_MOBILE: '/api/v1/auth/apple/mobile',
} as const;

export type AuthOAuthApiPathKey = keyof typeof AUTH_OAUTH_API_PATHS;
