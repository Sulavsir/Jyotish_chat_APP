/**
 * Cookie Utility Functions
 *
 * All tokens are stored as httpOnly cookies for maximum security:
 * - httpOnly: Prevents XSS attacks (JavaScript cannot access)
 * - secure: HTTPS only in production
 * - sameSite: CSRF protection
 */

import type { Response } from 'express';
import { AUTH_CONFIG } from '../constants';

/**
 * Set access token as httpOnly cookie (short-lived: 5 minutes)
 */
export function setAccessTokenCookie(res: Response, accessToken: string): void {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: AUTH_CONFIG.ACCESS_TOKEN_EXPIRES_IN_MS,
    path: '/',
    domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost', // Explicit domain for development
  });
}

/**
 * Set refresh token as httpOnly cookie (long-lived: 1 day)
 */
export function setRefreshTokenCookie(res: Response, refreshToken: string): void {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN_MS,
    path: '/',
    domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost', // Explicit domain for development
  });
}

/**
 * Set both access and refresh tokens as httpOnly cookies
 */
export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken);
}

/**
 * Clear all auth cookies (for logout)
 * IMPORTANT: Options must match EXACTLY with setAccessTokenCookie/setRefreshTokenCookie
 */
export function clearAuthCookies(res: Response): void {
  // Options must match the ones used when setting cookies
  const cookieOptions: any = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };

  // Add domain only in development (must match set cookie options)
  if (process.env.NODE_ENV !== 'production') {
    cookieOptions.domain = 'localhost';
  }

  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
}
