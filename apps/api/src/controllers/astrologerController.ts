/**
 * Astrologer Controller - Handle astrologer-specific authentication
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import {
  astrologerService,
  auditService,
  sessionService,
  passwordResetService,
  otpService,
} from '../services';
import * as astrologerEarningsService from '../services/astrologerEarnings.service';
import { sendSuccess } from '../utils';
import { HTTP_STATUS, ERROR_CODES, PASSWORD_RESET_ACTOR } from '../constants';
import { AppError } from '../middleware/error-handler';
import { setAuthCookies, clearAuthCookies } from '../utils/cookie-utils';
import { prisma } from '@jyotish/database';
import { AstrologerCategory } from '@prisma/client';
import { getSocketInstance } from '../utils/socket-instance';
import {
  astrologerRegistrationSchema,
  canAcceptAppointments,
  canAcceptBroadcastMessages,
} from '@jyotish/shared';
import { getClientIp } from '../utils/request-utils';

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
    setAuthCookies(res, result.accessToken, result.refreshToken);

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
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
    });

    return sendSuccess(res, {
      message: 'Login successful.',
      astrologer: result.astrologer,
    });
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
        ipAddress: getClientIp(req),
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
 * Request astrologer password reset (Astrologer table only).
 * POST /api/v1/astrologer/auth/forgot-password
 */
export async function requestAstrologerPasswordReset(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const { identifier } = req.body as { identifier: string };
  const result = await passwordResetService.handleRequestPasswordReset(
    identifier.trim(),
    'astrologer'
  );
  return sendSuccess(res, result);
}

/**
 * Reset astrologer password using email token (Astrologer table only).
 * POST /api/v1/astrologer/auth/reset-password-token
 */
export async function resetAstrologerPasswordWithToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const { token, password } = req.body as { token: string; password: string };
  await passwordResetService.handleResetPasswordWithToken(
    token,
    password,
    PASSWORD_RESET_ACTOR.ASTROLOGER
  );
  return sendSuccess(res, {
    message: 'Password has been reset successfully. You can now log in with your new password.',
  });
}

/**
 * Reset astrologer password using phone OTP (Astrologer table only).
 * POST /api/v1/astrologer/auth/reset-password-otp
 */
export async function resetAstrologerPasswordWithOTP(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const { phoneNumber, otp, sessionId, password } = req.body as {
    phoneNumber: string;
    otp: string;
    sessionId: string;
    password: string;
  };
  await passwordResetService.handleResetPasswordWithOtp(
    phoneNumber,
    otp,
    sessionId,
    password,
    PASSWORD_RESET_ACTOR.ASTROLOGER
  );
  return sendSuccess(res, {
    message: 'Password has been reset successfully. You can now log in with your new password.',
  });
}

/**
 * Verify OTP for astrologer password reset without consuming the session.
 * POST /api/v1/astrologer/auth/verify-password-reset-otp
 */
export async function verifyAstrologerPasswordResetOtp(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const { phoneNumber, otp, sessionId } = req.body as {
    phoneNumber: string;
    otp: string;
    sessionId: string;
  };
  await otpService.validateOTP(sessionId, phoneNumber, otp);
  return sendSuccess(res, {
    valid: true,
    message: 'OTP verified successfully.',
  });
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

    return sendSuccess(res, {
      astrologer: {
        ...astrologer,
        canAccessAppointments: canAcceptAppointments(astrologer.category),
        canAcceptBroadcastMessages: canAcceptBroadcastMessages(astrologer.category),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current astrologer's coin earnings (My Earnings)
 * GET /api/v1/astrologer/earnings
 */
export async function getMyEarnings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const astrologerId = req.user?.id;
    if (!astrologerId) {
      throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
    }
    const filters = req.query as {
      from?: string;
      to?: string;
      limit?: string;
      offset?: string;
      source?: 'CHAT_MESSAGE' | 'BROADCAST_MESSAGE' | 'APPOINTMENT';
    };
    const parsed = {
      from: filters.from ? new Date(filters.from) : undefined,
      to: filters.to ? new Date(filters.to) : undefined,
      limit: filters.limit ? parseInt(filters.limit, 10) : undefined,
      offset: filters.offset ? parseInt(filters.offset, 10) : undefined,
      source: filters.source,
    };
    const result = await astrologerEarningsService.getAstrologerEarnings(astrologerId, parsed);
    return sendSuccess(res, result);
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
      ipAddress: getClientIp(req),
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
      isDeleted: false,
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
      ipAddress: getClientIp(req),
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

/**
 * Register as astrologer (self-registration request)
 * POST /api/v1/astrologer/register
 */
export async function registerAstrologer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // Handle FormData - multer parses form fields into req.body
    // Arrays come as either arrays or single values depending on how they're sent
    let specialization: string[] = [];
    if (Array.isArray(req.body.specialization)) {
      specialization = req.body.specialization;
    } else if (typeof req.body.specialization === 'string') {
      specialization = [req.body.specialization];
    }

    let languages: string[] = [];
    if (Array.isArray(req.body.languages)) {
      languages = req.body.languages;
    } else if (typeof req.body.languages === 'string') {
      languages = [req.body.languages];
    }

    const { name, phone, email, password, bio, address, experience, gender, country } = req.body;

    // Get uploaded files - req.files is { [fieldname]: File[] } when using multer.fields()
    const files = req.files as { proofOfAstrology?: Express.Multer.File[]; profilePhoto?: Express.Multer.File[] } | undefined;
    const proofFiles = files?.proofOfAstrology ?? [];
    const profilePhotoFile = files?.profilePhoto?.[0];

    if (!proofFiles.length) {
      throw new AppError(
        'At least one proof of astrology certificate is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Construct file URLs array and store as JSON string
    const proofUrls = proofFiles.map(
      (file) => `/uploads/astrologer-registrations/${file.filename}`
    );
    const proofUrl = JSON.stringify(proofUrls);

    const profilePhoto = profilePhotoFile
      ? `/uploads/astrologer-registrations/${profilePhotoFile.filename}`
      : null;

    // Prepare data for validation (convert to expected format)
    const registrationData = {
      name,
      phone,
      email: email || '',
      password,
      bio: bio || undefined,
      address: address || null,
      specialization,
      experience: experience ? parseInt(experience, 10) : undefined,
      languages,
      gender: gender || null,
      country: country || null,
    };

    // Validate using the schema (this will throw if invalid)
    const validatedData = astrologerRegistrationSchema.parse(registrationData);

    // Register via service
    const astrologer = await astrologerService.registerRequest({
      name: validatedData.name,
      phone: validatedData.phone,
      email: validatedData.email || undefined,
      password: validatedData.password,
      bio: validatedData.bio,
      address: validatedData.address ?? null,
      profilePhoto: profilePhoto ?? undefined,
      specialization: validatedData.specialization,
      experience: validatedData.experience,
      languages: validatedData.languages,
      gender: validatedData.gender || undefined,
      country: validatedData.country ?? null,
      proofOfAstrology: proofUrl,
    });

    return sendSuccess(
      res,
      {
        message: 'Registration request submitted successfully. Please wait for admin approval.',
        astrologer,
      },
      201
    );
  } catch (error) {
    next(error);
  }
}
