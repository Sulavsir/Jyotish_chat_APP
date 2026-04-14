/**
 * Admin Controller - Handle admin panel requests
 * All endpoints require ADMIN role
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import {
  astrologerService,
  auditService,
  userService,
  sessionService,
  adminService,
  settingsService,
} from '../services';
import * as astrologerEarningsService from '../services/astrologerEarnings.service';
import { sendSuccess, sendError } from '../utils';
import type { ListAdminAstrologersQuery } from '../validators/adminAstrologer.validators';
import type { ToggleAstrologerOnlineBody } from '../validators/adminAstrologer.validators';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import { AppError } from '../middleware/error-handler';
import {
  prisma,
  Prisma,
  AuditAction,
  ChatStatus,
  AppointmentStatus,
  ComplaintStatus,
  CoinTransactionReason as DbCoinTransactionReason,
} from '@jyotish/database';
import { KundaliMatchStatus } from '@prisma/client';
import { AdminRole, NotificationType } from '@jyotish/shared';
import { setAuthCookies, clearAuthCookies } from '../utils/cookie-utils';
import { getClientIp } from '../utils/request-utils';
import { getSocketInstance } from '../utils/socket-instance';
import * as adminPlatformPaymentService from '../services/adminPlatformPayment.service';
import { utcDayEnd, utcDayStart } from '../utils/date-range.utils';
import {
  effectiveBroadcastAuditStatus,
  effectiveInstantChatAuditStatus,
  broadcastStatusFilterWhere,
  instantChatStatusFilterWhere,
} from '../utils/chat-audit-effective-status';
import { ASTROLOGER_ACCOUNT_STATUS } from '../constants/astrologer.constants';
import { NotificationService } from '../services/notification.service';
import type { ListAdminUsersQuery } from '../validators/adminUsersList.validators';
import type { ListAdminMonitorChatsQuery } from '../validators/adminChat.validators';
import type { ListAdminPlatformPaymentQuery } from '../validators/adminPlatformPayment.validators';
import type {
  AssignPendingBroadcastBody,
  UpdateAdminBroadcastSettingsBody,
} from '../validators/adminBroadcastSettings.validators';
import * as adminBroadcastSettingsService from '../services/adminBroadcastSettings.service';
import {
  addReportingDaysYmd,
  getReportingYmd,
  reportingDayEndInclusive,
  reportingDayStart,
} from '../utils/reporting-date.utils';

/** Rows that should appear in admin astrologer totals (soft-delete + legacy inconsistent rows). */
const ACTIVE_ASTROLOGER_COUNT_WHERE = {
  isDeleted: false,
  deletedAt: null,
} satisfies Prisma.AstrologerWhereInput;

/** Approved astrologers only — matches admin astrologer list (excludes pending/rejected/deleted). */
const APPROVED_ASTROLOGER_COUNT_WHERE = {
  ...ACTIVE_ASTROLOGER_COUNT_WHERE,
  accountStatus: ASTROLOGER_ACCOUNT_STATUS.APPROVED,
} satisfies Prisma.AstrologerWhereInput;

/** Client fields on monitor chat list/detail — matches astrologer “client details” birth block. */
const ADMIN_MONITOR_CHAT_CLIENT_SELECT = {
  id: true,
  name: true,
  phone: true,
  email: true,
  profilePhoto: true,
  dateOfBirth: true,
  timeOfBirth: true,
  placeOfBirth: true,
} satisfies Prisma.UserSelect;

// ==================== Admin Authentication ====================

/**
 * Admin login
 * POST /api/v1/admin/auth/login
 */
export async function adminLogin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      throw new AppError(
        'Email and password are required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const result = await adminService.login(email, password);

    // Set httpOnly cookies
    setAuthCookies(res, result.accessToken, result.refreshToken);

    // Don't log admin login to avoid cluttering audit logs
    // Admin activity monitoring is handled separately

    return sendSuccess(res, { admin: result.admin });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin refresh token
 * POST /api/v1/admin/auth/refresh
 */
export async function adminRefreshToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new AppError(
        'Refresh token not found',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    // Verify the refresh token using admin service
    const decoded = adminService.verifyRefreshToken(refreshToken);

    const adminRecord = await prisma.admin.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, isActive: true, adminRole: true },
    });

    if (!adminRecord || !adminRecord.isActive) {
      throw new AppError(
        'Admin account not found or deactivated',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    const adminRole = adminRecord.adminRole as AdminRole;

    // Generate new tokens
    const newAccessToken = adminService.generateAccessToken(adminRecord.id, adminRecord.email, adminRole);
    const newRefreshToken = adminService.generateRefreshToken(
      adminRecord.id,
      adminRecord.email,
      adminRole
    );

    // Set new httpOnly cookies
    setAuthCookies(res, newAccessToken, newRefreshToken);

    return sendSuccess(res, { message: 'Token refreshed successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin logout
 * POST /api/v1/admin/auth/logout
 */
export async function adminLogout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    clearAuthCookies(res);
    return sendSuccess(res, null);
  } catch (error) {
    next(error);
  }
}

/**
 * Get current admin user
 * GET /api/v1/admin/auth/me
 */
export async function getAdminProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const adminId = req.user?.id;

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        name: true,
        adminRole: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!admin) {
      throw new AppError('Admin not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    return sendSuccess(res, { admin });
  } catch (error) {
    next(error);
  }
}

// ==================== Astrologer Management ====================

/**
 * Verify astrologer edit password (before allowing edit/delete).
 * POST /api/v1/admin/astrologers/verify-edit-password
 */
export async function verifyAstrologerEditPassword(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const body = req.body as { password?: string };
    const password = body?.password;
    if (!password) {
      throw new AppError('Password is required', HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
    }
    const valid = await settingsService.verifyAstrologerEditPassword(password);
    if (!valid) {
      throw new AppError('Invalid edit password', HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
    }
    return sendSuccess(res, { valid: true });
  } catch (error) {
    next(error);
  }
}

/**
 * List all astrologers with pagination and filters
 * GET /api/v1/admin/astrologers
 */
export async function listAstrologers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as ListAdminAstrologersQuery;

    const result = await astrologerService.list({
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search,
      isActive: query.isActive,
      isVerified: query.isVerified,
      isOnline: query.isOnline,
    });

    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get astrologer by ID
 * GET /api/v1/admin/astrologers/:id
 */
export async function getAstrologer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const astrologer = await astrologerService.findByIdForAdmin(id);

    return sendSuccess(res, { astrologer });
  } catch (error) {
    next(error);
  }
}

/**
 * Create new astrologer
 * POST /api/v1/admin/astrologers
 */
export async function createAstrologer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new AppError('Admin ID not found', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
    }

    // Handle file upload(s) - req.files is { [fieldname]: File[] } when using multer.fields()
    const files = req.files as
      | { proofOfAstrology?: Express.Multer.File[]; profilePhoto?: Express.Multer.File[] }
      | undefined;
    const proofFiles = files?.proofOfAstrology ?? [];
    const profilePhotoFile = files?.profilePhoto?.[0];

    if (!proofFiles.length) {
      throw new AppError(
        'At least one proof of astrology certificate is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Construct proof URL(s): single string or JSON array string
    const proofUrls = proofFiles.map((f) => `/uploads/astrologer-registrations/${f.filename}`);
    const proofOfAstrology = proofUrls.length === 1 ? proofUrls[0]! : JSON.stringify(proofUrls);

    const profilePhoto = profilePhotoFile
      ? `/uploads/astrologer-registrations/${profilePhotoFile.filename}`
      : null;

    // Parse numeric fields from form data (they come as strings)
    const experience = req.body.experience ? parseInt(req.body.experience, 10) : null;
    const appointmentFee = req.body.appointmentFee ? parseFloat(req.body.appointmentFee) : null;
    const chatMessageFee = req.body.chatMessageFee ? parseFloat(req.body.chatMessageFee) : null;
    const { parseAstrologerCommissionFieldsFromBody } =
      await import('../utils/admin-astrologer-body.util');
    const commissionFields = parseAstrologerCommissionFieldsFromBody(
      req.body as Record<string, unknown>
    );
    const inhouseAstrologer =
      req.body.inhouseAstrologer === true ||
      req.body.inhouseAstrologer === 'true' ||
      req.body.inhouseAstrologer === '1';

    const astrologer = await astrologerService.create({
      ...req.body,
      experience,
      appointmentFee,
      chatMessageFee,
      createdBy: adminId,
      proofOfAstrology,
      profilePhoto: profilePhoto ?? undefined,
      inhouseAstrologer,
      ...commissionFields,
    });

    // Emit real-time stats update to admin
    const { AdminStatsEmitter } = require('../utils/admin-stats-emitter');
    AdminStatsEmitter.emitNewAstrologer();

    return sendSuccess(res, { astrologer }, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
}

/**
 * Update astrologer
 * PATCH /api/v1/admin/astrologers/:id
 * Requires editPassword in body (validated against Settings). Body validated by updateAstrologerSchema.
 */
export async function updateAstrologer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const body = { ...req.body } as Record<string, unknown>;
    const editPassword = body.editPassword as string | undefined;
    if (editPassword !== undefined && editPassword !== '') {
      const valid = await settingsService.verifyAstrologerEditPassword(editPassword);
      if (!valid) {
        throw new AppError('Invalid edit password', HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
      }
    }
    delete body.editPassword;
    delete body.isOnline;

    // Debug: log body and normalize inhouseAstrologer only when present
    // eslint-disable-next-line no-console
    console.log('[updateAstrologer] raw body:', req.body);

    if ('inhouseAstrologer' in body) {
      const raw = (req.body as Record<string, unknown>)?.inhouseAstrologer;

      // eslint-disable-next-line no-console
      console.log('[updateAstrologer] raw inhouseAstrologer field:', raw);

      if (typeof raw === 'string') {
        const trimmed = raw.trim();
        body.inhouseAstrologer =
          trimmed === 'true' || trimmed === '1' || trimmed.toLowerCase() === 'yes';
      } else {
        body.inhouseAstrologer = raw === true;
      }

      // eslint-disable-next-line no-console
      console.log('[updateAstrologer] normalized inhouseAstrologer:', body.inhouseAstrologer);
    } else {
      // eslint-disable-next-line no-console
      console.log('[updateAstrologer] inhouseAstrologer not present in body');
    }

    const astrologer = await astrologerService.update(id, body);

    return sendSuccess(res, { astrologer });
  } catch (error) {
    next(error);
  }
}

/**
 * Parse proofOfAstrology (single URL or JSON array string) to array of URLs
 */
function parseProofUrls(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [value];
  } catch {
    return [value];
  }
}

/**
 * Upload proof of astrology for an astrologer (appends to existing proofs)
 * POST /api/v1/admin/astrologers/:id/proof-upload
 */
export async function uploadAstrologerProof(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!req.file) {
      throw new AppError(
        'Proof of astrology file is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    const newUrl = `/uploads/astrologer-registrations/${req.file.filename}`;
    const existing = await astrologerService.findById(id);
    const existingUrls = parseProofUrls(existing?.proofOfAstrology ?? null);
    const mergedUrls = [...existingUrls, newUrl];
    const proofOfAstrology = mergedUrls.length === 1 ? mergedUrls[0]! : JSON.stringify(mergedUrls);
    const astrologer = await astrologerService.update(id, { proofOfAstrology });

    return sendSuccess(res, { astrologer });
  } catch (error) {
    next(error);
  }
}

/**
 * Upload profile photo for an astrologer (replaces existing)
 * POST /api/v1/admin/astrologers/:id/profile-photo
 */
export async function uploadAstrologerProfilePhoto(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    if (!req.file) {
      throw new AppError(
        'Profile photo file is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    const newUrl = `/uploads/astrologer-registrations/${req.file.filename}`;
    const astrologer = await astrologerService.update(id, { profilePhoto: newUrl });

    return sendSuccess(res, { astrologer });
  } catch (error) {
    next(error);
  }
}

export async function deleteAstrologer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const body = req.body as { editPassword?: string };
    const editPassword = body?.editPassword;
    if (!editPassword) {
      throw new AppError(
        'Edit password is required for this action',
        HTTP_STATUS.FORBIDDEN,
        ERROR_CODES.FORBIDDEN
      );
    }
    const valid = await settingsService.verifyAstrologerEditPassword(editPassword);
    if (!valid) {
      throw new AppError('Invalid edit password', HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
    }
    await astrologerService.delete(id);
    const { AdminStatsEmitter } = require('../utils/admin-stats-emitter');
    await AdminStatsEmitter.emitAstrologerCountChanged();
    return sendSuccess(res, null);
  } catch (error) {
    next(error);
  }
}

export async function toggleAstrologerStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const astrologer = await astrologerService.toggleStatus(id);

    return sendSuccess(res, { astrologer });
  } catch (error) {
    next(error);
  }
}

export async function toggleAstrologerOnlineStatus(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const body = req.body as ToggleAstrologerOnlineBody;
    const astrologer = await astrologerService.updateOnlineStatus(id, body.isOnline);

    try {
      const io = getSocketInstance();
      io.to(`user:${id}`).emit('astrologer:admin_status_changed', {
        astrologerId: id,
        isOnline: astrologer.isOnline,
        message: `Your status has been changed by Admin. You are ${astrologer.isOnline ? 'online' : 'offline'}.`,
      });

      io.emit('astrologer:status_changed', {
        astrologerId: id,
        name: astrologer.name,
        isOnline: astrologer.isOnline,
      });
      io.emit('user:status', {
        userId: id,
        status: astrologer.isOnline ? 'online' : 'offline',
      });
    } catch (_) {}

    const { AdminStatsEmitter } = require('../utils/admin-stats-emitter');
    void AdminStatsEmitter.emitOnlineAstrologersCount();

    return sendSuccess(res, {
      astrologer,
      message: `Astrologer is now ${astrologer.isOnline ? 'online' : 'offline'}.`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle astrologer verified status
 * POST /api/v1/admin/astrologers/:id/toggle-verify
 */
export async function toggleAstrologerVerified(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const astrologer = await astrologerService.toggleVerified(id);

    return sendSuccess(res, { astrologer });
  } catch (error) {
    next(error);
  }
}

/**
 * Get astrologer earnings
 * GET /api/v1/admin/astrologers/:id/earnings
 */
export async function getAstrologerEarnings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { page, limit, status } = req.query;

    const result = await astrologerService.getEarnings(id, {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      status: status as string,
    });

    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get all pending astrologer registration requests
 * GET /api/v1/admin/astrologers/registration-requests
 */
export async function getRegistrationRequests(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page = '1', limit = '10', search } = req.query;

    const result = await astrologerService.getPendingRegistrations({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      search: search as string | undefined,
    });

    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Approve an astrologer registration request
 * POST /api/v1/admin/astrologers/:id/approve-registration
 */
export async function approveRegistration(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;
    const { category, appointmentFee, chatMessageFee, inhouseAstrologer } = req.body;
    const { parseAstrologerCommissionFieldsFromBody } =
      await import('../utils/admin-astrologer-body.util');
    const commissionFields = parseAstrologerCommissionFieldsFromBody(
      req.body as Record<string, unknown>
    );

    const astrologer = await astrologerService.approveRegistration(id, adminId, {
      category,
      appointmentFee: appointmentFee ? parseFloat(String(appointmentFee)) : null,
      chatMessageFee: chatMessageFee ? parseFloat(String(chatMessageFee)) : null,
      inhouseAstrologer:
        inhouseAstrologer === true || inhouseAstrologer === 'true' || inhouseAstrologer === '1',
      ...commissionFields,
    });

    // Log audit event
    await auditService.logAction({
      adminId,
      action: AuditAction.ASTROLOGER_UPDATE,
      resource: 'Astrologer',
      resourceId: id,
      details: {
        action: 'approve_registration',
        category,
        appointmentFee,
        chatMessageFee,
        ...commissionFields,
        inhouseAstrologer,
      },
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
    });

    return sendSuccess(res, {
      message: 'Registration approved successfully',
      astrologer,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reject an astrologer registration request
 * POST /api/v1/admin/astrologers/:id/reject-registration
 */
export async function rejectRegistration(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;
    const { rejectionReason } = req.body;

    const astrologer = await astrologerService.rejectRegistration(id, adminId, rejectionReason);

    // Log audit event
    await auditService.logAction({
      adminId,
      action: AuditAction.ASTROLOGER_UPDATE,
      resource: 'Astrologer',
      resourceId: id,
      details: {
        action: 'reject_registration',
        rejectionReason,
      },
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
    });

    return sendSuccess(res, {
      message: 'Registration rejected successfully',
      astrologer,
    });
  } catch (error) {
    next(error);
  }
}

// ==================== User Management ====================

/**
 * List all users
 * GET /api/v1/admin/users
 */
export async function listUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit, search, isActive, joinedFrom, joinedTo } =
      req.query as unknown as ListAdminUsersQuery;

    const where: Prisma.UserWhereInput = { role: 'CLIENT' };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (joinedFrom || joinedTo) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (joinedFrom) createdAt.gte = utcDayStart(joinedFrom);
      if (joinedTo) createdAt.lte = utcDayEnd(joinedTo);
      where.createdAt = createdAt;
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          phone: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          profilePhoto: true,
          profileCompleted: true,
          zodiacSign: true,
          coins: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    // Compute total balance loaded per user (sum of ADD/PAYMENT_SUCCESS coin transactions)
    const userIds = users.map((u) => u.id);
    const loads =
      userIds.length > 0
        ? await prisma.coinTransaction.groupBy({
            by: ['userId'],
            where: {
              userId: { in: userIds },
              type: 'ADD',
              reason: DbCoinTransactionReason.PAYMENT_SUCCESS,
            },
            _sum: { amount: true },
          })
        : [];
    const loadMap = new Map<string, number>(loads.map((l) => [l.userId, l._sum.amount ?? 0]));

    const usersWithTotals = users.map((u) => ({
      ...u,
      totalBalanceLoaded: loadMap.get(u.id) ?? 0,
    }));

    return sendSuccess(res, {
      users: usersWithTotals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user by ID
 * GET /api/v1/admin/users/:id
 */
export async function getUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        profilePhoto: true,
        profileCompleted: true,
        dateOfBirth: true,
        timeOfBirth: true,
        placeOfBirth: true,
        currentAddress: true,
        zodiacSign: true,
        coins: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            consultationsAsClient: true,
            chatsAsClient: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    return sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
}

export async function addCoinsToUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;
    const adminId = req.user!.id;

    const coinService = await import('../services/coin.service');
    const { CoinTransactionReason } = await import('../types/coin.types');

    const reasonRaw = typeof reason === 'string' ? reason.trim() : '';
    const validReasons = Object.values(CoinTransactionReason) as string[];
    const resolvedReason = validReasons.includes(reasonRaw)
      ? (reasonRaw as (typeof CoinTransactionReason)[keyof typeof CoinTransactionReason])
      : CoinTransactionReason.ADMIN_ADJUSTMENT;

    const result = await coinService.addCoins(id, amount, resolvedReason, adminId);

    try {
      await auditService.logAction({
        userId: id,
        adminId,
        action: AuditAction.ADMIN_ACTION,
        resource: 'User',
        resourceId: id,
        details: {
          action: 'ADD_COINS',
          amount,
          reason: resolvedReason,
          ...(reasonRaw && resolvedReason === CoinTransactionReason.ADMIN_ADJUSTMENT
            ? { reasonInput: reasonRaw }
            : {}),
          newBalance: result.balance,
        },
      });
    } catch {
      // ignore
    }

    return sendSuccess(res, result, HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
}

export async function toggleUserStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });

    return sendSuccess(res, { user: updatedUser });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return sendSuccess(res, null);
  } catch (error) {
    next(error);
  }
}

// ==================== Audit Logs ====================

/**
 * List audit logs
 * GET /api/v1/admin/audit-logs
 */
export async function listAuditLogs(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit, userId, astrologerId, action, resource, startDate, endDate } = req.query;

    const result = await auditService.list({
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      userId: userId as string | undefined,
      astrologerId: astrologerId as string | undefined,
      action: action as AuditAction | undefined,
      resource: resource as string | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get audit log by ID
 * GET /api/v1/admin/audit-logs/:id
 */
export async function getAuditLog(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const log = await auditService.findById(id);

    if (!log) {
      throw new AppError('Audit log not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    return sendSuccess(res, { log });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user audit logs
 * GET /api/v1/admin/audit-logs/user/:userId
 */
export async function getUserAuditLogs(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params;
    const { page, limit } = req.query;

    const result = await auditService.getUserLogs(userId, {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get astrologer audit logs
 * GET /api/v1/admin/audit-logs/astrologer/:astrologerId
 */
export async function getAstrologerAuditLogs(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { astrologerId } = req.params;
    const { page, limit } = req.query;

    const result = await auditService.getAstrologerLogs(astrologerId, {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

// ==================== Chat Monitoring ====================

/**
 * List all chats for monitoring
 * GET /api/v1/admin/chats
 */
export async function listChats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit, status, search } = req.query as unknown as ListAdminMonitorChatsQuery;

    const pageNum = page ?? 1;
    const limitNum = limit ?? 10;

    const where: Prisma.ChatWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search?.trim()) {
      const s = search.trim();
      where.OR = [
        { clientParticipant: { name: { contains: s, mode: 'insensitive' } } },
        { clientParticipant: { phone: { contains: s } } },
        { clientParticipant: { email: { contains: s, mode: 'insensitive' } } },
        { astrologerParticipant: { name: { contains: s, mode: 'insensitive' } } },
        { astrologerParticipant: { phone: { contains: s } } },
        { astrologerParticipant: { email: { contains: s, mode: 'insensitive' } } },
        { lastMessageText: { contains: s, mode: 'insensitive' } },
      ];
    }

    const skip = (pageNum - 1) * limitNum;

    const [chats, total] = await Promise.all([
      prisma.chat.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          clientParticipant: {
            select: ADMIN_MONITOR_CHAT_CLIENT_SELECT,
          },
          astrologerParticipant: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              profilePhoto: true,
            },
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
        orderBy: { lastMessageAt: 'desc' },
      }),
      prisma.chat.count({ where }),
    ]);

    return sendSuccess(res, {
      chats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get chat by ID with messages
 * GET /api/v1/admin/chats/:id
 */
export async function getChat(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const chat = await prisma.chat.findUnique({
      where: { id },
      include: {
        clientParticipant: {
          select: ADMIN_MONITOR_CHAT_CLIENT_SELECT,
        },
        astrologerParticipant: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            profilePhoto: true,
          },
        },
      },
    });

    if (!chat) {
      throw new AppError('Chat not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    return sendSuccess(res, { chat });
  } catch (error) {
    next(error);
  }
}

/**
 * Get chat messages
 * GET /api/v1/admin/chats/:id/messages
 */
export async function getChatMessages(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { page = '1', limit = '50' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { chatId: id },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'asc' },
      }),
      prisma.message.count({ where: { chatId: id } }),
    ]);

    return sendSuccess(res, {
      messages,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Flag a message
 * POST /api/v1/admin/chats/messages/:messageId/flag
 */
export async function flagMessage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { messageId } = req.params;
    const { notes } = req.body;

    const message = await prisma.message.update({
      where: { id: messageId },
      data: {
        flaggedByAdmin: true,
        adminNotes: notes,
      },
    });

    return sendSuccess(res, { message });
  } catch (error) {
    next(error);
  }
}

/**
 * Add admin note to chat
 * POST /api/v1/admin/chats/:id/note
 */
export async function addChatNote(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const chat = await prisma.chat.update({
      where: { id },
      data: {
        adminNotes: notes,
        isMonitoredByAdmin: true,
      },
    });

    return sendSuccess(res, { chat });
  } catch (error) {
    next(error);
  }
}

/**
 * Cleanup stuck chats - Fix chats that are ACTIVE but should be ENDED
 * POST /api/v1/admin/chats/cleanup-stuck
 */
export async function cleanupStuckChats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { cleanupStuckChats: cleanup } = require('../utils/cleanup-stuck-chats');
    const result = await cleanup();

    return sendSuccess(res, {
      message: `Cleaned up ${result.fixed} stuck chat(s)`,
      fixed: result.fixed,
      chats: result.chats,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Abandon a conversation - Admin blocks both parties from continuing chat
 * POST /api/v1/admin/chats/:chatId/abandon
 */
export async function abandonChat(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { chatId } = req.params;
    const { reason } = req.body;
    const adminId = req.user!.id;

    // Get the chat
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        clientParticipant: {
          select: { id: true, name: true, phone: true },
        },
        astrologerParticipant: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    if (!chat) {
      throw new AppError('Chat not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    // Update chat to abandoned state
    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: {
        isAbandonedByAdmin: true,
        abandonedBy: adminId,
        abandonedAt: new Date(),
        abandonReason: reason || '',
        isLocked: true, // Also lock the chat
        status: 'ENDED', // Set status to ENDED
        endedBy: adminId,
        endedAt: new Date(),
      },
    });

    // Log audit action
    await auditService.logAction({
      adminId,
      action: AuditAction.CHAT_ABANDONED,
      resource: 'Chat',
      resourceId: chatId,
      details: {
        chatId,
        clientId: chat.participant1Id,
        astrologerId: chat.participant2Id,
        reason: reason || 'No reason provided',
      },
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
    });

    // Create notifications for both client and astrologer
    try {
      const { createChatAbandonedNotifications } =
        await import('../services/chatNotification.service');
      await createChatAbandonedNotifications(
        {
          id: chat.id,
          participant1Id: chat.participant1Id,
          participant2Id: chat.participant2Id,
        },
        reason
      );
    } catch (notifErr) {
      console.error('Error creating chat-abandoned notifications:', notifErr);
    }

    // Emit socket event to notify both parties
    try {
      const io = getSocketInstance();
      if (io) {
        const abandonData = {
          chatId,
          isAbandonedByAdmin: true,
          abandonedAt: new Date(),
          abandonReason: reason || 'This conversation has been ended by administration',
          isLocked: true,
          status: 'ENDED',
        };

        io.to(`user:${chat.participant1Id}`).emit('chat:abandoned', abandonData);
        io.to(`user:${chat.participant2Id}`).emit('chat:abandoned', abandonData);
        io.to('admin').emit('chat:abandoned', abandonData);

        console.log(`✅ Notified both parties and admins about chat abandonment: ${chatId}`);
      }
    } catch (socketError) {
      console.error('Error broadcasting chat abandonment:', socketError);
    }

    return sendSuccess(res, {
      message: 'Chat abandoned successfully',
      chat: updatedChat,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Unblock a conversation - Admin allows parties to resume chat
 * POST /api/v1/admin/chats/:chatId/unblock
 */
export async function unblockChat(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { chatId } = req.params;
    const adminId = req.user!.id;

    // Get the chat
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        clientParticipant: {
          select: { id: true, name: true, phone: true },
        },
        astrologerParticipant: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    if (!chat) {
      throw new AppError('Chat not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    if (!chat.isAbandonedByAdmin) {
      throw new AppError(
        'Chat is not abandoned',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Update chat to remove abandoned state
    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: {
        isAbandonedByAdmin: false,
        abandonedBy: null,
        abandonedAt: null,
        abandonReason: null,
        isLocked: false, // Unlock the chat
        status: 'ACTIVE', // Reactivate
        reopenedAfterEnded: true,
        endedBy: null,
        endedAt: null,
      },
    });

    // Log audit action
    await auditService.logAction({
      adminId,
      action: AuditAction.CHAT_UNBLOCKED,
      resource: 'Chat',
      resourceId: chatId,
      details: {
        chatId,
        clientId: chat.participant1Id,
        astrologerId: chat.participant2Id,
      },
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
    });

    // Emit socket event to notify both parties
    try {
      const io = getSocketInstance();
      if (io) {
        const unblockData = {
          chatId,
          isAbandonedByAdmin: false,
          isLocked: false,
          status: 'ACTIVE',
        };

        // Notify client and astrologer
        io.to(`user:${chat.participant1Id}`).emit('chat:unblocked', unblockData);
        io.to(`user:${chat.participant2Id}`).emit('chat:unblocked', unblockData);
        // Notify admin panel for real-time list update
        io.to('admin').emit('chat:unblocked', unblockData);

        console.log(`✅ Notified both parties and admins about chat unblock: ${chatId}`);
      }
    } catch (socketError) {
      console.error('Error broadcasting chat unblock:', socketError);
    }

    return sendSuccess(res, {
      message: 'Chat unblocked successfully',
      chat: updatedChat,
    });
  } catch (error) {
    next(error);
  }
}

export async function reopenChat(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { chatId } = req.params;
    const adminId = req.user!.id;

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        clientParticipant: { select: { id: true, name: true, phone: true } },
        astrologerParticipant: { select: { id: true, name: true, phone: true } },
      },
    });

    if (!chat) {
      throw new AppError('Chat not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    if (chat.status === ChatStatus.ACTIVE && !chat.isLocked) {
      throw new AppError(
        'Chat is already active',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: {
        status: ChatStatus.ACTIVE,
        isLocked: false,
        reopenedAfterEnded: true,
        endedBy: null,
        endedAt: null,
        waitingForReply: false,
      },
    });

    await auditService.logAction({
      adminId,
      action: AuditAction.ADMIN_ACTION,
      resource: 'Chat',
      resourceId: chatId,
      details: {
        chatId,
        clientId: chat.participant1Id,
        astrologerId: chat.participant2Id,
        action: 'CHAT_REOPENED',
      },
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
    });

    try {
      const { AdminStatsEmitter } = require('../utils/admin-stats-emitter');
      AdminStatsEmitter.emitSidebarInvalidate();
    } catch (_) {}

    try {
      const io = getSocketInstance();
      if (io) {
        const payload = {
          chatId,
          status: 'ACTIVE',
          isLocked: false,
          chat: updatedChat,
        };
        io.to(`user:${chat.participant1Id}`).emit('chat:reopened', payload);
        io.to(`user:${chat.participant2Id}`).emit('chat:reopened', payload);
        io.to('admin').emit('chat:reopened', payload);
        console.log(`✅ Notified both parties and admins about chat reopen: ${chatId}`);
      }
    } catch (socketError) {
      console.error('Error broadcasting chat reopen:', socketError);
    }

    return sendSuccess(res, {
      message: 'Chat reopened successfully. Both parties can now send messages.',
      chat: updatedChat,
    });
  } catch (error) {
    next(error);
  }
}

// ==================== Dashboard ====================
let lifetimeTotalsCache: { totalEarnings: number; platformTotalLoaded: number } | null = null;
let lifetimeTotalsCachedAt = 0;
const LIFETIME_CACHE_TTL_MS = 0;

async function getLifetimeTotals() {
  if (lifetimeTotalsCache && Date.now() - lifetimeTotalsCachedAt < LIFETIME_CACHE_TTL_MS) {
    return lifetimeTotalsCache;
  }
  const [earningsAgg, platformAgg] = await Promise.all([
    (prisma as any).astrologerCoinEarning.aggregate({ _sum: { astrologerCoinsEarned: true } }),
    prisma.coinTransaction.aggregate({
      _sum: { amount: true },
      where: { reason: 'PAYMENT_SUCCESS' },
    }),
  ]);
  lifetimeTotalsCache = {
    totalEarnings: earningsAgg._sum.astrologerCoinsEarned ?? 0,
    platformTotalLoaded: platformAgg._sum.amount ?? 0,
  };
  lifetimeTotalsCachedAt = Date.now();
  return lifetimeTotalsCache;
}

/**
 * Get dashboard statistics
 * GET /api/v1/admin/dashboard/stats
 */
export async function getDashboardStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const todayYmd = getReportingYmd(now);
    const todayStart = reportingDayStart(todayYmd);
    const todayEnd = reportingDayEndInclusive(todayYmd);
    const platformTodayStart = todayStart;
    const platformTomorrowStart = reportingDayStart(addReportingDaysYmd(todayYmd, 1));

    const [
      lifetimeTotals,
      totalUsers,
      totalAstrologers,
      pendingAstrologerRegistrations,
      activeChats,
      onlineAstrologers,
      todayConsultations,
      newUsersToday,
      todayEarnings,
      platformTodayLoaded,
    ] = await Promise.all([
      getLifetimeTotals(),
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.astrologer.count({ where: APPROVED_ASTROLOGER_COUNT_WHERE }),
      prisma.astrologer.count({
        where: {
          accountStatus: ASTROLOGER_ACCOUNT_STATUS.PENDING,
          ...ACTIVE_ASTROLOGER_COUNT_WHERE,
        },
      }),
      prisma.chat.count({ where: { status: 'ACTIVE' } }),
      prisma.astrologer.count({
        where: {
          ...APPROVED_ASTROLOGER_COUNT_WHERE,
          isActive: true,
          isOnline: true,
        },
      }),
      prisma.consultation.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }),
      prisma.user.count({
        where: { role: 'CLIENT', createdAt: { gte: todayStart, lte: todayEnd } },
      }),
      // Today's astrologer coin earnings
      (prisma as any).astrologerCoinEarning.aggregate({
        _sum: { astrologerCoinsEarned: true },
        where: { createdAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.coinTransaction.aggregate({
        _sum: { amount: true },
        where: {
          reason: DbCoinTransactionReason.PAYMENT_SUCCESS,
          createdAt: { gte: platformTodayStart, lt: platformTomorrowStart },
        },
      }),
    ]);

    const totalEarnings = { _sum: { astrologerCoinsEarned: lifetimeTotals.totalEarnings } };
    const platformTotalLoaded = { _sum: { amount: lifetimeTotals.platformTotalLoaded } };

    const stats = {
      totalUsers,
      totalAstrologers,
      /** Same definition as sidebar `pendingAstrologerRegistrations` (GET /admin/sidebar-counts). */
      pendingAstrologerRegistrations,
      activeChats,
      onlineAstrologers,
      // Total Earnings (Astrologers) — lifetime coins earned across all astrologers
      totalEarnings: totalEarnings._sum.astrologerCoinsEarned || 0,
      todayConsultations,
      newUsersToday,
      // Today's Earnings (Astrologers) — coins earned today
      todayEarnings: todayEarnings._sum.astrologerCoinsEarned || 0,
      platformTotalLoaded: platformTotalLoaded._sum.amount || 0,
      platformTodayLoaded: platformTodayLoaded._sum.amount || 0,
    };

    if (req.user?.adminRole === AdminRole.USER_SUPPORT) {
      return sendSuccess(res, {
        stats: {
          ...stats,
          totalEarnings: 0,
          todayEarnings: 0,
          platformTotalLoaded: 0,
          platformTodayLoaded: 0,
        },
      });
    }

    return sendSuccess(res, { stats });
  } catch (error) {
    next(error);
  }
}

/**
 * Get recent activities
 * GET /api/v1/admin/dashboard/recent-activities
 */
export async function getRecentActivities(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { limit = '10' } = req.query;

    const activities = await auditService.getRecentActivity(parseInt(limit as string));

    return sendSuccess(res, { activities });
  } catch (error) {
    next(error);
  }
}

// ==================== Earnings Management ====================

/**
 * List astrologers with their total coin earnings (for admin earnings table)
 * GET /api/v1/admin/earnings/astrologers-with-coins
 */
export async function listAstrologersWithCoinEarnings(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const query = req.query as {
      page?: number;
      limit?: number;
      search?: string;
      from?: Date;
      to?: Date;
    };
    const result = await astrologerEarningsService.listAstrologersWithCoinEarnings({
      page: query.page,
      limit: query.limit,
      search: query.search,
      from: query.from,
      to: query.to,
    });
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get platform payment history (admin view) – successful payments only
 * GET /api/v1/admin/coin-transactions
 * Returns PAYMENT_SUCCESS coin transactions with paymentMethod from Payment table
 */
export async function getPlatformTransactions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await adminPlatformPaymentService.listAdminPlatformPaymentTransactions(
      req.query as unknown as ListAdminPlatformPaymentQuery
    );
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

export async function getBroadcastSettings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await adminBroadcastSettingsService.getAdminBroadcastSettings();
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

export async function updateBroadcastSettings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const body = req.body as UpdateAdminBroadcastSettingsBody;
    const result = await adminBroadcastSettingsService.updateAdminBroadcastSettings(body);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

export async function assignPendingBroadcast(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const body = req.body as AssignPendingBroadcastBody;

    const result = await adminBroadcastSettingsService.assignPendingBroadcastByAdmin({
      messageId: id,
      astrologerId: body.astrologerId,
    });

    const accepted = result.accepted;
    const assignedByAdmin = result.assignedByAdmin === true;

    const assignedAstrologerId = body.astrologerId;
    const messageId = id;
    const chatId = accepted.chat?.id;
    const clientId = accepted.message?.clientId;

    if (!chatId || !clientId) {
      throw new AppError(
        'Missing chat/client identifiers after broadcast assignment',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const io = getSocketInstance();
    const notificationService = new NotificationService();

    // 1) Assigned astrologer: open chat immediately + update broadcast badges
    try {
      io.to(`user:${assignedAstrologerId}`).emit('broadcast:messageAccepted', {
        ...accepted,
        assignedByAdmin,
      });
    } catch {
      // Non-fatal: assignment still succeeded in DB
    }

    // 2) Client: open chat immediately (same socket event as normal acceptance)
    try {
      io.to(`user:${clientId}`).emit('broadcast:yourMessageAccepted', {
        message: accepted.message,
        chat: accepted.chat,
        astrologer: accepted.message?.acceptedAstrologer,
        initialMessages: accepted.initialMessages,
      });
    } catch {
      // Non-fatal
    }

    // 3) Notifications (notifications bell bar)
    const astrologerName = accepted.message?.acceptedAstrologer?.name || 'An astrologer';
    const clientAcceptedMsg = `Your request has been accepted by ${astrologerName}. Starting your chat now.`;

    try {
      const clientNotification = await notificationService.createNotification({
        userId: clientId,
        type: NotificationType.BROADCAST_ACCEPTED,
        title: 'Chat Request Accepted',
        message: clientAcceptedMsg,
        metadata: { broadcastMessageId: messageId, chatId },
      });

      io.to(`user:${clientId}`).emit('notification:new', clientNotification);
    } catch {
      // Non-fatal
    }

    const adminAssignedMsg = 'Admin assigned you this broadcast request. Opening chat…';
    try {
      const astrologerNotification = await notificationService.createNotification({
        astrologerId: assignedAstrologerId,
        type: NotificationType.BROADCAST_ACCEPTED,
        title: 'Broadcast Assigned by Admin',
        message: adminAssignedMsg,
        metadata: { broadcastMessageId: messageId, chatId },
      });

      io.to(`user:${assignedAstrologerId}`).emit('notification:new', astrologerNotification);
    } catch {
      // Non-fatal
    }

    // 4) Other in-house astrologers: update broadcast badge/status immediately
    try {
      const clientName = accepted.message?.client?.name || accepted.message?.client?.phone || 'Client';

      const otherEligibleAstrologers = await prisma.astrologer.findMany({
        where: {
          id: { not: assignedAstrologerId },
          inhouseAstrologer: true,
          isActive: true,
          isDeleted: false,
        },
        select: { id: true, name: true, inhouseAstrologer: true },
      });

      const allAcceptedMessageIds = accepted.allAcceptedMessageIds ?? [messageId];
      const acceptedAt = accepted.message?.acceptedAt;

      const acceptedByPayload = {
        messageId,
        allAcceptedMessageIds,
        acceptedBy: { id: assignedAstrologerId, name: astrologerName },
        acceptedAt,
        clientName,
      };

      const requestAcceptedPayload = {
        messageId,
        allAcceptedMessageIds,
        message: `${clientName}'s request is no longer active. It has already been accepted.`,
        acceptedBy: { id: assignedAstrologerId, name: astrologerName },
      };

      await Promise.all(
        otherEligibleAstrologers.map(async (a) => {
          // Persist a notification (similar to normal acceptance flow)
          try {
            await notificationService.createNotification({
              astrologerId: a.id,
              type: NotificationType.BROADCAST_ACCEPTED,
              title: 'Request No Longer Available',
              message: `${clientName}'s request is no longer active. It has already been accepted by another astrologer for counselling.`,
              metadata: { broadcastMessageId: messageId, acceptedBy: assignedAstrologerId },
            });
          } catch {
            // Non-fatal
          }

          io.to(`user:${a.id}`).emit('notification:requestAccepted', requestAcceptedPayload);
          io.to(`user:${a.id}`).emit('broadcast:messageAcceptedByAstrologer', acceptedByPayload);
        })
      );
    } catch {
      // Non-fatal
    }

    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * List all earnings
 * GET /api/v1/admin/earnings
 */
export async function listEarnings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page = '1', limit = '10', status, astrologerId } = req.query;

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (astrologerId) {
      where.astrologerId = astrologerId;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [earnings, total] = await Promise.all([
      prisma.astrologerEarnings.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        include: {
          astrologer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.astrologerEarnings.count({ where }),
    ]);

    return sendSuccess(res, {
      earnings,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Approve earning
 * POST /api/v1/admin/earnings/:id/approve
 */
export async function approveEarning(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const earning = await prisma.astrologerEarnings.update({
      where: { id },
      data: { status: 'APPROVED' },
    });

    return sendSuccess(res, { earning });
  } catch (error) {
    next(error);
  }
}

/**
 * Reject earning
 * POST /api/v1/admin/earnings/:id/reject
 */
export async function rejectEarning(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const earning = await prisma.astrologerEarnings.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    return sendSuccess(res, { earning });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark earning as paid
 * POST /api/v1/admin/earnings/:id/mark-paid
 */
export async function markEarningPaid(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { transactionId } = req.body;

    const earning = await prisma.astrologerEarnings.update({
      where: { id },
      data: {
        status: 'PAID',
        payoutDate: new Date(),
        transactionId,
      },
    });

    return sendSuccess(res, { earning });
  } catch (error) {
    next(error);
  }
}

// ==================== Chat Audit ====================

/**
 * Get chat audit logs - includes broadcast messages, instant chat requests, all chat activities
 * GET /api/v1/admin/chat-audit
 */
export async function getChatAudit(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page = '1', limit = '10', status, search, type } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    // Build where clauses (AND of status + search). Status uses wall-clock for PENDING/EXPIRED.
    const broadcastConditions: Record<string, unknown>[] = [];
    const instantConditions: Record<string, unknown>[] = [];

    if (status && status !== 'ALL') {
      broadcastConditions.push(broadcastStatusFilterWhere(status as string));
      instantConditions.push(instantChatStatusFilterWhere(status as string));
    }

    if (search) {
      const searchCondition = [
        { client: { name: { contains: search as string, mode: 'insensitive' } } },
        { client: { phone: { contains: search as string } } },
      ];
      broadcastConditions.push({ OR: searchCondition });
      instantConditions.push({ OR: searchCondition });
    }

    const broadcastWhere: Record<string, unknown> =
      broadcastConditions.length > 0 ? { AND: broadcastConditions } : {};
    const instantChatWhere: Record<string, unknown> =
      instantConditions.length > 0 ? { AND: instantConditions } : {};

    // Type filter
    const shouldFetchBroadcast = !type || type === 'BROADCAST_MESSAGE';
    const shouldFetchInstant = !type || type === 'INSTANT_CHAT_REQUEST';

    // Fetch both types in parallel
    const [broadcastMessages, instantChatRequests] = await Promise.all([
      shouldFetchBroadcast
        ? prisma.broadcastMessage.findMany({
            where: broadcastWhere,
            take: take * 2, // Fetch more to merge and paginate
            include: {
              client: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  profilePhoto: true,
                },
              },
              acceptedAstrologer: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  profilePhoto: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          })
        : [],
      shouldFetchInstant
        ? prisma.instantChatRequest.findMany({
            where: instantChatWhere,
            take: take * 2, // Fetch more to merge and paginate
            include: {
              client: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  profilePhoto: true,
                },
              },
              acceptedAstrologer: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  profilePhoto: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          })
        : [],
    ]);

    // Transform into unified audit format (effective status when DB not yet swept)
    const broadcastAuditLogs = broadcastMessages.map((msg) => {
      const effectiveStatus = effectiveBroadcastAuditStatus(msg.status, msg.expiresAt);
      return {
        id: msg.id,
        type: 'BROADCAST_MESSAGE' as const,
        action: effectiveStatus,
        status: effectiveStatus,
        client: msg.client,
        astrologer: msg.acceptedAstrologer,
        content: msg.content,
        messageType: msg.type,
        metadata: msg.metadata,
        createdAt: msg.createdAt,
        acceptedAt: msg.acceptedAt,
        chatId: msg.chatId,
        expiresAt: msg.expiresAt,
      };
    });

    const instantChatAuditLogs = instantChatRequests.map((req) => {
      const effectiveStatus = effectiveInstantChatAuditStatus(req.status, req.expiresAt);
      return {
        id: req.id,
        type: 'INSTANT_CHAT_REQUEST' as const,
        action: effectiveStatus,
        status: effectiveStatus,
        client: req.client,
        astrologer: req.acceptedAstrologer,
        content: req.message,
        messageType: 'TEXT' as const,
        metadata: null,
        createdAt: req.createdAt,
        acceptedAt: req.acceptedAt,
        chatId: req.chatId,
        expiresAt: req.expiresAt,
      };
    });

    // Merge and sort by creation date
    const allLogs = [...broadcastAuditLogs, ...instantChatAuditLogs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Apply pagination
    const paginatedLogs = allLogs.slice(skip, skip + take);

    // Get total count for pagination
    const [broadcastTotal, instantChatTotal] = await Promise.all([
      shouldFetchBroadcast ? prisma.broadcastMessage.count({ where: broadcastWhere }) : 0,
      shouldFetchInstant ? prisma.instantChatRequest.count({ where: instantChatWhere }) : 0,
    ]);
    const total = broadcastTotal + instantChatTotal;

    return sendSuccess(res, {
      logs: paginatedLogs,
      pagination: {
        page: parseInt(page as string),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get chat audit statistics
 * GET /api/v1/admin/chat-audit/stats
 */
export async function getChatAuditStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const [
      totalBroadcasts,
      pendingBroadcasts,
      acceptedBroadcasts,
      expiredBroadcasts,
      totalInstantChats,
      pendingInstantChats,
      acceptedInstantChats,
      expiredInstantChats,
      cancelledInstantChats,
    ] = await Promise.all([
      prisma.broadcastMessage.count(),
      prisma.broadcastMessage.count({ where: { status: 'PENDING' } }),
      prisma.broadcastMessage.count({ where: { status: 'ACCEPTED' } }),
      prisma.broadcastMessage.count({ where: { status: 'EXPIRED' } }),
      prisma.instantChatRequest.count(),
      prisma.instantChatRequest.count({ where: { status: 'PENDING' } }),
      prisma.instantChatRequest.count({ where: { status: 'ACCEPTED' } }),
      prisma.instantChatRequest.count({ where: { status: 'EXPIRED' } }),
      prisma.instantChatRequest.count({ where: { status: 'CANCELLED' } }),
    ]);

    const stats = {
      broadcast: {
        total: totalBroadcasts,
        pending: pendingBroadcasts,
        accepted: acceptedBroadcasts,
        expired: expiredBroadcasts,
      },
      instantChat: {
        total: totalInstantChats,
        pending: pendingInstantChats,
        accepted: acceptedInstantChats,
        expired: expiredInstantChats,
        cancelled: cancelledInstantChats,
      },
      overall: {
        total: totalBroadcasts + totalInstantChats,
        pending: pendingBroadcasts + pendingInstantChats,
        accepted: acceptedBroadcasts + acceptedInstantChats,
        expired: expiredBroadcasts + expiredInstantChats,
      },
    };

    return sendSuccess(res, { stats });
  } catch (error) {
    next(error);
  }
}

// ==================== Complaint Management ====================

/**
 * Get all complaints for admin review
 * GET /api/v1/admin/complaints
 */
export async function getComplaints(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status, category, priority, astrologerId, limit = 50, offset = 0 } = req.query;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;
    if (astrologerId) where.astrologerId = astrologerId;

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        include: {
          client: {
            select: { id: true, name: true, phone: true, email: true, profilePhoto: true },
          },
          astrologer: {
            select: { id: true, name: true, phone: true, email: true, profilePhoto: true },
          },
          chat: {
            select: { id: true, status: true, createdAt: true, lastMessageAt: true },
          },
          resolver: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: [
          { priority: 'desc' }, // HIGH priority first
          { createdAt: 'desc' }, // Newest first
        ],
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.complaint.count({ where }),
    ]);

    return sendSuccess(res, {
      complaints,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + complaints.length < total,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get complaint statistics
 * GET /api/v1/admin/complaints/stats
 */
export async function getComplaintStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const [
      totalComplaints,
      pendingComplaints,
      inReviewComplaints,
      resolvedComplaints,
      dismissedComplaints,
      escalatedComplaints,
      highPriorityComplaints,
      complaintsByCategory,
    ] = await Promise.all([
      prisma.complaint.count(),
      prisma.complaint.count({ where: { status: 'PENDING' } }),
      prisma.complaint.count({ where: { status: 'IN_REVIEW' } }),
      prisma.complaint.count({ where: { status: 'RESOLVED' } }),
      prisma.complaint.count({ where: { status: 'DISMISSED' } }),
      prisma.complaint.count({ where: { status: 'ESCALATED' } }),
      prisma.complaint.count({ where: { priority: 'HIGH' } }),
      prisma.complaint.groupBy({
        by: ['category'],
        _count: true,
      }),
    ]);

    const stats = {
      total: totalComplaints,
      byStatus: {
        pending: pendingComplaints,
        inReview: inReviewComplaints,
        resolved: resolvedComplaints,
        dismissed: dismissedComplaints,
        escalated: escalatedComplaints,
      },
      byPriority: {
        high: highPriorityComplaints,
      },
      byCategory: complaintsByCategory.reduce(
        (acc: Record<string, number>, item: { category: string; _count: number }) => {
          acc[item.category] = item._count;
          return acc;
        },
        {}
      ),
    };

    return sendSuccess(res, { stats });
  } catch (error) {
    next(error);
  }
}

/**
 * Update complaint status
 * PATCH /api/v1/admin/complaints/:id/status
 */
export async function updateComplaintStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.user!.id;

    if (!status) {
      throw new AppError(
        'Status is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true } },
        astrologer: { select: { id: true, name: true } },
      },
    });

    if (!complaint) {
      throw new AppError('Complaint not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    const updatedComplaint = await prisma.complaint.update({
      where: { id },
      data: { status },
      include: {
        client: {
          select: { id: true, name: true, phone: true, email: true, profilePhoto: true },
        },
        astrologer: {
          select: { id: true, name: true, phone: true, email: true, profilePhoto: true },
        },
        chat: {
          select: { id: true, status: true },
        },
        resolver: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Log audit action
    await auditService.logAction({
      adminId,
      action: AuditAction.COMPLAINT_UPDATE,
      resource: 'Complaint',
      resourceId: id,
      details: {
        complaintId: id,
        oldStatus: complaint.status,
        newStatus: status,
        clientId: complaint.clientId,
        astrologerId: complaint.astrologerId,
      },
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
    });

    // Emit socket event
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('complaint:update', updatedComplaint);
      }
      const { AdminStatsEmitter } = require('../utils/admin-stats-emitter');
      AdminStatsEmitter.emitSidebarInvalidate();
    } catch (socketError) {
      console.error('Error emitting complaint:update event:', socketError);
    }

    return sendSuccess(res, {
      message: 'Complaint status updated successfully',
      complaint: updatedComplaint,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Resolve a complaint
 * POST /api/v1/admin/complaints/:id/resolve
 */
export async function resolveComplaint(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { resolution, adminNotes } = req.body;
    const adminId = req.user!.id;

    if (!resolution) {
      throw new AppError(
        'Resolution is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true } },
        astrologer: { select: { id: true, name: true } },
      },
    });

    if (!complaint) {
      throw new AppError('Complaint not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    const updatedComplaint = await prisma.complaint.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolution,
        adminNotes,
        resolvedBy: adminId,
        resolvedAt: new Date(),
      },
      include: {
        client: {
          select: { id: true, name: true, phone: true, email: true, profilePhoto: true },
        },
        astrologer: {
          select: { id: true, name: true, phone: true, email: true, profilePhoto: true },
        },
        chat: {
          select: { id: true, status: true },
        },
        resolver: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Log audit action
    await auditService.logAction({
      adminId,
      action: AuditAction.COMPLAINT_RESOLVE,
      resource: 'Complaint',
      resourceId: id,
      details: {
        complaintId: id,
        resolution,
        clientId: complaint.clientId,
        astrologerId: complaint.astrologerId,
      },
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
    });

    // Emit socket event
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('complaint:resolved', updatedComplaint);
        // Notify the client
        io.to(`user:${complaint.clientId}`).emit('complaint:resolved', {
          complaintId: id,
          resolution,
        });
      }
      const { AdminStatsEmitter } = require('../utils/admin-stats-emitter');
      AdminStatsEmitter.emitSidebarInvalidate();
    } catch (socketError) {
      console.error('Error emitting complaint:resolved event:', socketError);
    }

    return sendSuccess(res, {
      message: 'Complaint resolved successfully',
      complaint: updatedComplaint,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Sidebar counts for admin navigation badges.
 * GET /api/v1/admin/sidebar-counts
 */
export async function getSidebarCounts(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const todayYmd = getReportingYmd(now);
    const todayStart = reportingDayStart(todayYmd);
    const todayEnd = reportingDayEndInclusive(todayYmd);

    const [
      activeChats,
      pendingComplaints,
      pendingAppointments,
      pendingKundaliMatch,
      totalUsers,
      newUsersToday,
      totalAstrologers,
      pendingAstrologerRegistrations,
      platformTransactions,
    ] = await Promise.all([
      prisma.chat.count({ where: { status: ChatStatus.ACTIVE } }),
      prisma.complaint.count({ where: { status: ComplaintStatus.PENDING } }),
      prisma.appointment.count({ where: { status: AppointmentStatus.PENDING } }),
      prisma.kundaliMatchRequest.count({ where: { status: KundaliMatchStatus.PENDING } }),
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }),
      prisma.astrologer.count({ where: APPROVED_ASTROLOGER_COUNT_WHERE }),
      prisma.astrologer.count({
        where: { accountStatus: 'PENDING', ...ACTIVE_ASTROLOGER_COUNT_WHERE },
      }),
      prisma.coinTransaction.count({
        where: { type: 'ADD', reason: DbCoinTransactionReason.PAYMENT_SUCCESS },
      }),
    ]);

    const isUserSupport = req.user?.adminRole === AdminRole.USER_SUPPORT;

    return sendSuccess(res, {
      counts: {
        activeChats,
        pendingComplaints,
        pendingAppointments,
        pendingKundaliMatch,
        totalUsers,
        newUsersToday,
        totalAstrologers,
        pendingAstrologerRegistrations,
        platformTransactions: isUserSupport ? 0 : platformTransactions,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Dismiss a complaint
 * POST /api/v1/admin/complaints/:id/dismiss
 */
export async function dismissComplaint(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user!.id;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true } },
        astrologer: { select: { id: true, name: true } },
      },
    });

    if (!complaint) {
      throw new AppError('Complaint not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    const updatedComplaint = await prisma.complaint.update({
      where: { id },
      data: {
        status: 'DISMISSED',
        adminNotes: reason,
        resolvedBy: adminId,
        resolvedAt: new Date(),
      },
      include: {
        client: {
          select: { id: true, name: true, phone: true, email: true, profilePhoto: true },
        },
        astrologer: {
          select: { id: true, name: true, phone: true, email: true, profilePhoto: true },
        },
        chat: {
          select: { id: true, status: true },
        },
        resolver: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Log audit action
    await auditService.logAction({
      adminId,
      action: AuditAction.COMPLAINT_DISMISS,
      resource: 'Complaint',
      resourceId: id,
      details: {
        complaintId: id,
        reason,
        clientId: complaint.clientId,
        astrologerId: complaint.astrologerId,
      },
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
    });

    // Emit socket event
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('complaint:dismissed', updatedComplaint);
      }
      const { AdminStatsEmitter } = require('../utils/admin-stats-emitter');
      AdminStatsEmitter.emitSidebarInvalidate();
    } catch (socketError) {
      console.error('Error emitting complaint:dismissed event:', socketError);
    }

    return sendSuccess(res, {
      message: 'Complaint dismissed successfully',
      complaint: updatedComplaint,
    });
  } catch (error) {
    next(error);
  }
}
