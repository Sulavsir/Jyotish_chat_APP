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
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    // In development: secure must be false for HTTP, sameSite must be 'lax' (not 'none' without HTTPS)
    // In production: secure true with sameSite 'lax' for better security
    secure: isProduction,
    sameSite: 'lax', // Always use 'lax' - works for same-site and cross-site navigation
    maxAge: AUTH_CONFIG.ACCESS_TOKEN_EXPIRES_IN_MS,
    path: '/',
    // Don't set domain in development to allow cookies to work on both localhost and IP addresses
    domain: isProduction ? process.env.COOKIE_DOMAIN : undefined,
  });
}

/**
 * Set refresh token as httpOnly cookie (long-lived: 1 day)
 */
export function setRefreshTokenCookie(res: Response, refreshToken: string): void {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    // In development: secure must be false for HTTP, sameSite must be 'lax' (not 'none' without HTTPS)
    // In production: secure true with sameSite 'lax' for better security
    secure: isProduction,
    sameSite: 'lax', // Always use 'lax' - works for same-site and cross-site navigation
    maxAge: AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN_MS,
    path: '/',
    // Don't set domain in development to allow cookies to work on both localhost and IP addresses
    domain: isProduction ? process.env.COOKIE_DOMAIN : undefined,
  });
}

/**
 * Set both access and refresh tokens as httpOnly cookies.
 * Category/permissions are not set as cookies; frontend gets them from GET /me (works cross-domain).
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
  const isProduction = process.env.NODE_ENV === 'production';

  const cookieOptions: any = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  };

  // In production, use the COOKIE_DOMAIN from env
  if (isProduction && process.env.COOKIE_DOMAIN) {
    cookieOptions.domain = process.env.COOKIE_DOMAIN;
  }
  // In development, don't set domain to work with both localhost and IP addresses

  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);

  // Clear legacy astrologerCategory cookie if present (no longer set, but clear for old clients)
  const categoryCookieOptions = { ...cookieOptions, httpOnly: false };
  res.clearCookie('astrologerCategory', categoryCookieOptions);
}
