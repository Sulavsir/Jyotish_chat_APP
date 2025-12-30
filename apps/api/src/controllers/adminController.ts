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
} from '../services';
import { sendSuccess, sendError } from '../utils';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import { AppError } from '../middleware/error-handler';
import { prisma } from '@jyotish/database';
import { setAuthCookies, clearAuthCookies } from '../utils/cookie-utils';

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

    // Log admin login
    await auditService.logAction({
      adminId: result.admin.id,
      action: 'ADMIN_LOGIN',
      resource: 'Admin',
      resourceId: result.admin.id,
      details: { email },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return sendSuccess(res, { admin: result.admin });
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

    if (req.user?.id) {
      await auditService.logAction({
        adminId: req.user.id,
        action: 'ADMIN_LOGOUT',
        resource: 'Admin',
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
 * Get current admin user
 * GET /api/v1/admin/auth/me
 */
export async function getAdminProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const adminId = req.user?.id;

    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profilePhoto: true,
        createdAt: true,
      },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new AppError('Admin not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    return sendSuccess(res, { admin });
  } catch (error) {
    next(error);
  }
}

// ==================== Astrologer Management ====================

/**
 * List all astrologers with pagination and filters
 * GET /api/v1/admin/astrologers
 */
export async function listAstrologers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit, search, isActive, isVerified, isOnline } = req.query;

    const result = await astrologerService.list({
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      search: search as string,
      isActive: isActive ? isActive === 'true' : undefined,
      isVerified: isVerified ? isVerified === 'true' : undefined,
      isOnline: isOnline ? isOnline === 'true' : undefined,
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
    const astrologer = await astrologerService.findById(id);

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

    const astrologer = await astrologerService.create({
      ...req.body,
      createdBy: adminId,
    });

    return sendSuccess(res, { astrologer }, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
}

/**
 * Update astrologer
 * PATCH /api/v1/admin/astrologers/:id
 */
export async function updateAstrologer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const astrologer = await astrologerService.update(id, req.body);

    return sendSuccess(res, { astrologer });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete astrologer (soft delete)
 * DELETE /api/v1/admin/astrologers/:id
 */
export async function deleteAstrologer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await astrologerService.delete(id);

    return sendSuccess(res, null);
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle astrologer active status
 * POST /api/v1/admin/astrologers/:id/toggle-status
 */
export async function toggleAstrologerStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const astrologer = await astrologerService.toggleStatus(id);

    return sendSuccess(res, { astrologer });
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

// ==================== User Management ====================

/**
 * List all users
 * GET /api/v1/admin/users
 */
export async function listUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page = '1', limit = '10', search, isActive } = req.query;

    const where: any = { role: 'CLIENT' }; // Only CLIENT users

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit as string),
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
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return sendSuccess(res, {
      users,
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

/**
 * Toggle user active status
 * POST /api/v1/admin/users/:id/toggle-status
 */
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

/**
 * Delete user
 * DELETE /api/v1/admin/users/:id
 */
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
      userId: userId as string,
      astrologerId: astrologerId as string,
      action: action as any,
      resource: resource as string,
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
    const { page = '1', limit = '10', status, search } = req.query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      // Search by client or astrologer name
      where.OR = [
        { clientParticipant: { name: { contains: search as string, mode: 'insensitive' } } },
        { astrologerParticipant: { name: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [chats, total] = await Promise.all([
      prisma.chat.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        include: {
          clientParticipant: {
            select: {
              id: true,
              name: true,
              phone: true,
              profilePhoto: true,
            },
          },
          astrologerParticipant: {
            select: {
              id: true,
              name: true,
              phone: true,
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
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            profilePhoto: true,
          },
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

// ==================== Dashboard ====================

/**
 * Get dashboard statistics
 * GET /api/v1/admin/dashboard/stats
 */
export async function getDashboardStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const [
      totalUsers,
      totalAstrologers,
      activeChats,
      totalEarnings,
      pendingEarnings,
      todayConsultations,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.astrologer.count(),
      prisma.chat.count({ where: { status: 'ACTIVE' } }),
      prisma.astrologerEarnings.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID' },
      }),
      prisma.astrologerEarnings.aggregate({
        _sum: { amount: true },
        where: { status: 'PENDING' },
      }),
      prisma.consultation.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    const stats = {
      totalUsers,
      totalAstrologers,
      activeChats,
      totalEarnings: totalEarnings._sum.amount || 0,
      pendingEarnings: pendingEarnings._sum.amount || 0,
      todayConsultations,
    };

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
 * List all earnings
 * GET /api/v1/admin/earnings
 */
export async function listEarnings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page = '1', limit = '10', status, astrologerId } = req.query;

    const where: any = {};

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
