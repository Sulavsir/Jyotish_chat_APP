/**
 * Audit Service - Track all user, astrologer, and admin activities
 * Provides full visibility for admin monitoring
 */

import { prisma, AuditAction } from '@jyotish/database';

interface LogActionParams {
  userId?: string;
  astrologerId?: string;
  adminId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export class AuditService {
  /**
   * Log an action to the audit log
   */
  async logAction(params: LogActionParams) {
    const auditLog = await prisma.auditLog.create({
      data: {
        userId: params.userId,
        astrologerId: params.astrologerId,
        adminId: params.adminId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        details: params.details || {},
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        metadata: params.metadata || {},
      },
    });

    return auditLog;
  }

  /**
   * Get audit logs with pagination and filters
   */
  async list(params: {
    page?: number;
    limit?: number;
    userId?: string;
    astrologerId?: string;
    adminId?: string;
    action?: AuditAction;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { page = 1, limit = 20, userId, astrologerId, adminId, action, resource, startDate, endDate } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (astrologerId) {
      where.astrologerId = astrologerId;
    }

    if (adminId) {
      where.adminId = adminId;
    }

    if (action) {
      where.action = action;
    }

    if (resource) {
      where.resource = resource;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          astrologer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get audit log by ID
   */
  async findById(id: string) {
    const log = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        astrologer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return log;
  }

  /**
   * Get recent activity for dashboard
   */
  async getRecentActivity(limit: number = 10) {
    const logs = await prisma.auditLog.findMany({
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        astrologer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return logs;
  }

  /**
   * Get user-specific logs
   */
  async getUserLogs(userId: string, params: { page?: number; limit?: number }) {
    return this.list({ ...params, userId });
  }

  /**
   * Get astrologer-specific logs
   */
  async getAstrologerLogs(astrologerId: string, params: { page?: number; limit?: number }) {
    return this.list({ ...params, astrologerId });
  }

  /**
   * Get admin action logs
   */
  async getAdminLogs(adminId: string, params: { page?: number; limit?: number }) {
    return this.list({ ...params, adminId });
  }

  /**
   * Get activity statistics
   */
  async getStats(params: { startDate?: Date; endDate?: Date }) {
    const where: any = {};

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = params.startDate;
      }
      if (params.endDate) {
        where.createdAt.lte = params.endDate;
      }
    }

    const [totalLogs, userActions, astrologerActions, adminActions, actionBreakdown] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.count({ where: { ...where, userId: { not: null } } }),
      prisma.auditLog.count({ where: { ...where, astrologerId: { not: null } } }),
      prisma.auditLog.count({ where: { ...where, adminId: { not: null } } }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: {
          _all: true,
        },
      }),
    ]);

    return {
      totalLogs,
      userActions,
      astrologerActions,
      adminActions,
      actionBreakdown,
    };
  }
}

export const auditService = new AuditService();



