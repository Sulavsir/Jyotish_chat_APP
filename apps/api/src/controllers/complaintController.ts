/**
 * Complaint Controller
 * Handles user complaints against astrologers
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '@jyotish/database';
import { AuthRequest } from '../types';
import { AppError, sendSuccess, ERROR_CODES, HTTP_STATUS } from '../utils';
import { auditService } from '../services/audit.service';
import { ComplaintCategory, ComplaintPriority, ComplaintStatus, AuditAction } from '@jyotish/database';
import { getClientIp } from '../utils/request-utils';

/**
 * Create a new complaint
 * POST /api/v1/complaints
 */
export async function createComplaint(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { astrologerId, chatId, subject, description, category } = req.body;
    const file = (req as any).file; // Multer attaches file here

    // Validate required fields
    if (!astrologerId || !subject || !description || !category) {
      throw new AppError(
        'Astrologer ID, subject, description, and category are required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Validate category
    if (!Object.values(ComplaintCategory).includes(category)) {
      throw new AppError(
        'Invalid complaint category',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Verify astrologer exists
    const astrologer = await prisma.astrologer.findUnique({
      where: { id: astrologerId },
      select: { id: true, name: true },
    });

    if (!astrologer) {
      throw new AppError(
        'Astrologer not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.NOT_FOUND
      );
    }

    // If chatId is provided, verify the chat exists and involves both parties
    if (chatId) {
      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
      });

      if (!chat) {
        throw new AppError(
          'Chat not found',
          HTTP_STATUS.NOT_FOUND,
          ERROR_CODES.NOT_FOUND
        );
      }

      // Verify the user is part of this chat
      if (chat.participant1Id !== userId) {
        throw new AppError(
          'You are not a participant in this chat',
          HTTP_STATUS.FORBIDDEN,
          ERROR_CODES.FORBIDDEN
        );
      }

      // Verify the astrologer is part of this chat
      if (chat.participant2Id !== astrologerId) {
        throw new AppError(
          'The specified astrologer is not part of this chat',
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
    }

    // Determine priority based on category
    let priority: ComplaintPriority = ComplaintPriority.MEDIUM;
    if (category === ComplaintCategory.INAPPROPRIATE_BEHAVIOR) {
      priority = ComplaintPriority.HIGH;
    } else if (category === ComplaintCategory.NO_RESPONSE) {
      priority = ComplaintPriority.MEDIUM;
    } else if (category === ComplaintCategory.SLOW_RESPONSE) {
      priority = ComplaintPriority.LOW;
    }

    // Generate attachment URL if file was uploaded
    let attachmentUrl: string | null = null;
    if (file) {
      // Store relative path from uploads directory
      attachmentUrl = `/uploads/complaints/${file.filename}`;
    }

    // Create the complaint
    const complaint = await prisma.complaint.create({
      data: {
        clientId: userId,
        astrologerId,
        chatId: chatId || null,
        subject,
        description,
        category,
        priority,
        attachmentUrl,
        status: ComplaintStatus.PENDING,
      },
      include: {
        client: {
          select: { id: true, name: true, phone: true, email: true },
        },
        astrologer: {
          select: { id: true, name: true, phone: true, email: true },
        },
        chat: {
          select: { id: true, createdAt: true, lastMessageAt: true },
        },
      },
    });

    const { AdminStatsEmitter } = require('../utils/admin-stats-emitter');
    AdminStatsEmitter.emitSidebarInvalidate();

    // Log audit action
    await auditService.logAction({
      userId,
      action: AuditAction.COMPLAINT_CREATE,
      resource: 'Complaint',
      resourceId: complaint.id,
      details: {
        complaintId: complaint.id,
        astrologerId,
        chatId,
        category,
        subject,
      },
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
    });

    // Emit socket event to admin for real-time notification
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('complaint:new', {
          complaint,
          timestamp: new Date(),
        });
        console.log('✅ Emitted complaint:new event to admins');
      }
    } catch (socketError) {
      console.error('Error emitting complaint:new event:', socketError);
    }

    return sendSuccess(res, {
      message: 'Complaint submitted successfully. Our support team will review it shortly.',
      complaint,
    }, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
}

/**
 * Get user's complaints
 * GET /api/v1/complaints
 */
export async function getUserComplaints(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { status, limit = 50, offset = 0 } = req.query;

    const where: any = { clientId: userId };
    if (status) {
      where.status = status as ComplaintStatus;
    }

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        include: {
          astrologer: {
            select: { id: true, name: true, phone: true, profilePhoto: true },
          },
          chat: {
            select: { id: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
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
 * Get a single complaint by ID
 * GET /api/v1/complaints/:id
 */
export async function getComplaintById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
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
    });

    if (!complaint) {
      throw new AppError(
        'Complaint not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.NOT_FOUND
      );
    }

    // Verify the user owns this complaint
    if (complaint.clientId !== userId) {
      throw new AppError(
        'You do not have permission to view this complaint',
        HTTP_STATUS.FORBIDDEN,
        ERROR_CODES.FORBIDDEN
      );
    }

    return sendSuccess(res, { complaint });
  } catch (error) {
    next(error);
  }
}

