/**
 * Astrologer Controller - Handle astrologer-specific authentication
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { astrologerService, auditService } from '../services';
import { sendSuccess } from '../utils';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import { AppError } from '../middleware/error-handler';
import { setAuthCookies, clearAuthCookies } from '../utils/cookie-utils';

/**
 * Astrologer login with phone/email and password
 * POST /api/v1/astrologer/auth/login
 */
export async function astrologerLogin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { identifier, password } = req.body;

    // Validate input
    if (!identifier || !password) {
      throw new AppError(
        'Phone/Email and password are required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const result = await astrologerService.login(identifier, password);

    // Set httpOnly cookies
    setAuthCookies(res, result.accessToken, result.refreshToken);

    // Log astrologer login
    await auditService.logAction({
      astrologerId: result.astrologer.id,
      action: 'ASTROLOGER_LOGIN',
      resource: 'Astrologer',
      resourceId: result.astrologer.id,
      details: { identifier },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return sendSuccess(res, { astrologer: result.astrologer });
  } catch (error) {
    next(error);
  }
}

/**
 * Astrologer logout
 * POST /api/v1/astrologer/auth/logout
 */
export async function astrologerLogout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    clearAuthCookies(res);

    if (req.user?.id) {
      await auditService.logAction({
        astrologerId: req.user.id,
        action: 'ASTROLOGER_LOGOUT',
        resource: 'Astrologer',
        resourceId: req.user.id,
        ipAddress: req.ip,
      });
    }

    return sendSuccess(res, null);
  } catch (error) {
    next(error);
  }
}

/**
 * Get current astrologer profile
 * GET /api/v1/astrologer/auth/me
 */
export async function getAstrologerProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const astrologerId = req.user?.id;

    if (!astrologerId) {
      throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
    }

    const astrologer = await astrologerService.findById(astrologerId);

    return sendSuccess(res, { astrologer });
  } catch (error) {
    next(error);
  }
}
