/**
 * Astrologer Controller - Handle astrologer-specific authentication
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { astrologerService, auditService, sessionService } from '../services';
import { sendSuccess } from '../utils';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import { AppError } from '../middleware/error-handler';
import { setAuthCookies, clearAuthCookies } from '../utils/cookie-utils';
import { prisma } from '@jyotish/database';
import { AstrologerCategory } from '@prisma/client';
import { getSocketInstance } from '../utils/socket-instance';

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

    // Extract device information
    const { extractDeviceInfo } = require('../utils/device-utils');
    const deviceInfo = extractDeviceInfo(req);

    const result = await astrologerService.login(identifier, password, deviceInfo);

    // Set httpOnly cookies with category
    setAuthCookies(res, result.accessToken, result.refreshToken, result.astrologer.category);

    // Log astrologer login
    await auditService.logAction({
      astrologerId: result.astrologer.id,
      action: 'ASTROLOGER_LOGIN',
      resource: 'Astrologer',
      resourceId: result.astrologer.id,
      details: {
        identifier,
        deviceType: deviceInfo.deviceType,
        deviceName: deviceInfo.deviceName,
      },
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
    // Get refresh token from cookie
    const refreshToken = req.cookies.refreshToken;

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

    // Revoke the refresh token session
    if (refreshToken) {
      try {
        await sessionService.revokeSessionByToken(refreshToken);
      } catch (error) {
        // Log error but still return success - cookies are cleared
        console.error('Error revoking astrologer session:', error);
      }
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

/**
 * Toggle online/offline status
 * POST /api/v1/astrologer/toggle-online
 */
export async function toggleOnlineStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const astrologerId = req.user?.id;

    if (!astrologerId) {
      throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
    }

    const { isOnline } = req.body;

    // Update online status
    const updatedAstrologer = await prisma.astrologer.update({
      where: { id: astrologerId },
      data: { isOnline },
      select: {
        id: true,
        name: true,
        isOnline: true,
      },
    });

    // Log audit event
    await auditService.logAction({
      astrologerId,
      action: 'ASTROLOGER_UPDATE',
      resource: 'Astrologer',
      resourceId: astrologerId,
      details: { isOnline, action: 'toggle_online_status' },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    console.log(
      `🔄 Astrologer ${updatedAstrologer.name} is now ${isOnline ? 'ONLINE' : 'OFFLINE'}`
    );

    // Emit socket events for real-time status update
    try {
      const io = getSocketInstance();
      // Emit astrologer-specific event (for admins and monitoring)
      io.emit('astrologer:status_changed', {
        astrologerId,
        name: updatedAstrologer.name,
        isOnline: updatedAstrologer.isOnline,
      });

      // ALSO emit user:status event (used by client-side online lists)
      io.emit('user:status', {
        userId: astrologerId,
        status: updatedAstrologer.isOnline ? 'online' : 'offline',
      });
    } catch {
      // If socket isn't initialized, still return REST response successfully.
    }

    return sendSuccess(res, {
      message: `You are now ${isOnline ? 'online' : 'offline'}`,
      isOnline: updatedAstrologer.isOnline,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get list of astrologers (for appointment booking)
 * GET /api/v1/astrologer/list
 */
export async function listAstrologers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { forAppointments, onlineOnly } = req.query;

    const where: any = {
      isActive: true,
    };

    // Filter by online status (for chat)
    if (onlineOnly === 'true') {
      where.isOnline = true;
    }

    // If requesting for appointments, filter to PROFESSIONAL and PREMIUM only
    if (forAppointments === 'true') {
      where.category = {
        in: [AstrologerCategory.PROFESSIONAL, AstrologerCategory.PREMIUM],
      };
    }

    const astrologers = await prisma.astrologer.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        profilePhoto: true,
        bio: true,
        specialization: true,
        experience: true,
        rating: true,
        totalConsultations: true,
        category: true,
        appointmentFee: true,
        isActive: true,
        isOnline: true,
        isVerified: true,
        languages: true,
      },
      orderBy: [
        { isOnline: 'desc' }, // Online astrologers first
        { rating: 'desc' }, // Then by rating
      ],
    });

    return sendSuccess(res, astrologers);
  } catch (error) {
    next(error);
  }
}

/**
 * Change astrologer password
 * POST /api/v1/astrologer/auth/change-password
 */
export async function changeAstrologerPassword(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { currentPassword, newPassword } = req.body;
    const astrologerId = req.user?.id;

    if (!astrologerId) {
      throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
    }

    // Change password via service
    await astrologerService.changePassword(astrologerId, currentPassword, newPassword);

    // Fetch updated astrologer to return
    const updatedAstrologer = await prisma.astrologer.findUnique({
      where: { id: astrologerId },
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        profilePhoto: true,
        bio: true,
        specialization: true,
        experience: true,
        category: true,
        appointmentFee: true,
        rating: true,
        totalConsultations: true,
        isActive: true,
        isOnline: true,
        isVerified: true,
        commissionRate: true,
        languages: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log audit event
    await auditService.logAction({
      astrologerId,
      action: 'ASTROLOGER_UPDATE',
      resource: 'Astrologer',
      resourceId: astrologerId,
      details: { action: 'change_password' },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return sendSuccess(res, {
      message: 'Password changed successfully',
      astrologer: updatedAstrologer,
    });
  } catch (error) {
    next(error);
  }
}
