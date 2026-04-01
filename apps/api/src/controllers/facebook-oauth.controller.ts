import { Response, NextFunction } from 'express';
import { AuthRequest, FacebookMobileLoginResponse } from '../types';
import type { FacebookMobileLoginInput } from '../validators';
import { setAuthCookies } from '../utils';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import { facebookOAuthService } from '../services/facebook-oauth.service';
import { AppError } from '../middleware/error-handler';
import { logUserLogin, logUserRegister } from '../utils';
import { getClientIp } from '../utils/request-utils';

const FRONTEND_URL = () => process.env.FRONTEND_URL || 'http://localhost:3000';

const OAUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 10 * 60 * 1000,
  path: '/',
};

export async function facebookMobileLogin(req: AuthRequest, res: Response, _next: NextFunction) {
  const { accessToken } = req.body as FacebookMobileLoginInput;

  try {
    const profile = await facebookOAuthService.verifyMobileAccessToken(accessToken);

    const metadata = {
      userAgent: req.headers['user-agent'],
      ipAddress: getClientIp(req) ?? req.socket?.remoteAddress,
    };

    const result = await facebookOAuthService.findOrCreateUser(profile, metadata);

    if (result.isNewUser) {
      await logUserRegister(result.user.id, req, {
        method: 'facebook_mobile',
        email: profile.email,
      });
    } else {
      await logUserLogin(result.user.id, req, {
        loginMethod: 'facebook_mobile',
        email: profile.email,
      });
    }

    const response: FacebookMobileLoginResponse = {
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
    if (error instanceof AppError) {
      throw error;
    }
    console.error('[FacebookOAuth] Mobile login error:', error);
    throw new AppError(
      'Facebook authentication failed',
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.UNAUTHORIZED
    );
  }
}

export async function facebookLogin(req: AuthRequest, res: Response, _next: NextFunction) {
  const { url, state } = facebookOAuthService.createAuthorizationParams();

  res.cookie('facebook_oauth_state', state, OAUTH_COOKIE_OPTIONS);

  return res.redirect(url.toString());
}

export async function facebookCallback(req: AuthRequest, res: Response, _next: NextFunction) {
  const { code, state } = req.query as { code?: string; state?: string };
  const storedState = req.cookies?.facebook_oauth_state as string | undefined;

  res.clearCookie('facebook_oauth_state', { path: '/' });

  if (!code || !state || !storedState) {
    return res.redirect(
      `${FRONTEND_URL()}/auth/login?error=${encodeURIComponent('Missing OAuth parameters. Please try again.')}`
    );
  }

  if (state !== storedState) {
    return res.redirect(
      `${FRONTEND_URL()}/auth/login?error=${encodeURIComponent('Invalid OAuth state. Please try again.')}`
    );
  }

  try {
    const profile = await facebookOAuthService.validateWebCallback(code);

    const metadata = {
      userAgent: req.headers['user-agent'],
      ipAddress: getClientIp(req) ?? req.socket?.remoteAddress,
    };

    const result = await facebookOAuthService.findOrCreateUser(profile, metadata);

    setAuthCookies(res, result.accessToken, result.refreshToken);

    if (result.isNewUser) {
      await logUserRegister(result.user.id, req, {
        method: 'facebook',
        email: profile.email,
      });
    } else {
      await logUserLogin(result.user.id, req, {
        loginMethod: 'facebook',
        email: profile.email,
      });
    }

    return res.redirect(`${FRONTEND_URL()}/auth/facebook/callback?success=true`);
  } catch (error) {
    const message =
      error instanceof AppError
        ? error.message
        : 'Facebook authentication failed. Please try again.';

    console.error('Facebook OAuth callback error:', error);

    return res.redirect(`${FRONTEND_URL()}/auth/login?error=${encodeURIComponent(message)}`);
  }
}
