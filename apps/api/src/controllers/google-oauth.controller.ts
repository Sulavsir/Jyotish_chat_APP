import { Response, NextFunction } from 'express';
import { AuthRequest, GoogleMobileLoginResponse } from '../types';
import { setAuthCookies } from '../utils';
import { HTTP_STATUS, ERROR_CODES, getFrontendOrigin } from '../constants';
import { googleOAuthService } from '../services/google-oauth.service';
import { AppError } from '../middleware/error-handler';
import { logUserLogin, logUserRegister } from '../utils';
import { getClientIp } from '../utils/request-utils';
import type { GoogleMobileLoginInput } from '../validators';
import {
  OAUTH_FRONTEND_COOKIE,
  resolveOAuthRedirectBase,
  setOAuthFrontendCookieIfAllowed,
} from '../utils/oauth-frontend-redirect.utils';

/**
 * Handle Google Sign-In from mobile apps (Flutter)
 * POST /api/v1/auth/google/mobile
 *
 * Accepts an ID token from google_sign_in Flutter package,
 * verifies it with Google, and returns JWT tokens.
 *
 * Note: Request body is validated by googleMobileLoginSchema middleware
 */
export async function googleMobileLogin(req: AuthRequest, res: Response, _next: NextFunction) {
  // Body is already validated by middleware
  const { idToken } = req.body as GoogleMobileLoginInput;

  try {
    const googleUser = await googleOAuthService.verifyIdToken(idToken);

    const metadata = {
      userAgent: req.headers['user-agent'],
      ipAddress: getClientIp(req) ?? req.socket?.remoteAddress,
    };

    const result = await googleOAuthService.findOrCreateUser(googleUser, metadata);

    if (result.isNewUser) {
      await logUserRegister(result.user.id, req, {
        method: 'google_mobile',
        email: googleUser.email,
      });
    } else {
      await logUserLogin(result.user.id, req, {
        loginMethod: 'google_mobile',
        email: googleUser.email,
      });
    }

    const response: GoogleMobileLoginResponse = {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
      isNewUser: result.isNewUser,
    };

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: response,
    });
  } catch (error) {
    // Re-throw AppErrors as-is, wrap others
    if (error instanceof AppError) {
      throw error;
    }
    console.error('[GoogleOAuth] Mobile login error:', error);
    throw new AppError(
      'Google authentication failed',
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.UNAUTHORIZED
    );
  }
}

const OAUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 10 * 60 * 1000, // 10 minutes
  path: '/',
};

/**
 * Initiate Google OAuth flow
 * GET /api/v1/auth/google/login
 *
 * Generates state + PKCE code_verifier, stores them in httpOnly cookies,
 * and redirects the user to Google's authorization URL.
 */
export async function googleLogin(req: AuthRequest, res: Response, _next: NextFunction) {
  const { url, state, codeVerifier } = googleOAuthService.createAuthorizationParams();

  setOAuthFrontendCookieIfAllowed(res, OAUTH_FRONTEND_COOKIE.GOOGLE, req.query.frontend);

  res.cookie('google_oauth_state', state, OAUTH_COOKIE_OPTIONS);
  res.cookie('google_oauth_code_verifier', codeVerifier, OAUTH_COOKIE_OPTIONS);

  return res.redirect(url.toString());
}

/**
 * Handle Google OAuth callback
 * GET /api/v1/auth/google/callback
 *
 * Validates state, exchanges the authorization code with PKCE verifier,
 * fetches user info from Google, finds or creates the user,
 * sets auth cookies, and redirects to the frontend.
 */
export async function googleCallback(req: AuthRequest, res: Response, _next: NextFunction) {
  const frontendBase = resolveOAuthRedirectBase(
    req,
    res,
    OAUTH_FRONTEND_COOKIE.GOOGLE,
    getFrontendOrigin()
  );

  const { code, state } = req.query as { code?: string; state?: string };
  const storedState = req.cookies?.google_oauth_state as string | undefined;
  const storedCodeVerifier = req.cookies?.google_oauth_code_verifier as string | undefined;

  // Clear OAuth cookies immediately
  res.clearCookie('google_oauth_state', { path: '/' });
  res.clearCookie('google_oauth_code_verifier', { path: '/' });

  if (!code || !state || !storedState || !storedCodeVerifier) {
    return res.redirect(
      `${frontendBase}/auth/login?error=${encodeURIComponent('Missing OAuth parameters. Please try again.')}`
    );
  }

  if (state !== storedState) {
    return res.redirect(
      `${frontendBase}/auth/login?error=${encodeURIComponent('Invalid OAuth state. Please try again.')}`
    );
  }

  try {
    const googleUser = await googleOAuthService.validateCallback(code, storedCodeVerifier);

    const metadata = {
      userAgent: req.headers['user-agent'],
      ipAddress: getClientIp(req) ?? req.socket?.remoteAddress,
    };

    const result = await googleOAuthService.findOrCreateUser(googleUser, metadata);

    setAuthCookies(res, result.accessToken, result.refreshToken);

    if (result.isNewUser) {
      await logUserRegister(result.user.id, req, {
        method: 'google',
        email: googleUser.email,
      });
    } else {
      await logUserLogin(result.user.id, req, {
        loginMethod: 'google',
        email: googleUser.email,
      });
    }

    return res.redirect(`${frontendBase}/auth/google/callback?success=true`);
  } catch (error) {
    const message =
      error instanceof AppError
        ? error.message
        : 'Google authentication failed. Please try again.';

    console.error('Google OAuth callback error:', error);

    return res.redirect(
      `${frontendBase}/auth/login?error=${encodeURIComponent(message)}`
    );
  }
}
