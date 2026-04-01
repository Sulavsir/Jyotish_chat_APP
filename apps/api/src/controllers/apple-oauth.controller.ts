import { Response, NextFunction } from 'express';
import { AuthRequest, AppleMobileLoginResponse } from '../types';
import type { AppleMobileLoginInput } from '../validators';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import { appleOAuthService } from '../services/apple-oauth.service';
import { AppError } from '../middleware/error-handler';
import { logUserLogin, logUserRegister } from '../utils';
import { getClientIp } from '../utils/request-utils';

/**
 * Sign in with Apple — native apps only (identity token from Apple).
 * POST /api/v1/auth/apple/verify-token
 */
export async function appleMobileLogin(req: AuthRequest, res: Response, _next: NextFunction) {
  const { identityToken } = req.body as AppleMobileLoginInput;

  try {
    const profile = await appleOAuthService.verifyIdentityToken(identityToken);

    const metadata = {
      userAgent: req.headers['user-agent'],
      ipAddress: getClientIp(req) ?? req.socket?.remoteAddress,
    };

    const result = await appleOAuthService.findOrCreateUser(profile, metadata);

    if (result.isNewUser) {
      await logUserRegister(result.user.id, req, {
        method: 'apple_mobile',
        email: profile.email,
      });
    } else {
      await logUserLogin(result.user.id, req, {
        loginMethod: 'apple_mobile',
        email: profile.email,
      });
    }

    const response: AppleMobileLoginResponse = {
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
    console.error('[AppleOAuth] Mobile login error:', error);
    throw new AppError(
      'Apple authentication failed',
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.UNAUTHORIZED
    );
  }
}
