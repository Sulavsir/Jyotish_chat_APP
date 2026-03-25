/**
 * Admin Appointment Controller
 * Handles admin viewing all appointments and cancelling appointments
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils';
import { prisma } from '@jyotish/database';
import * as appointmentService from '../services/appointment.service';

/**
 * Get all appointments (admin only), paginated.
 * GET /api/v1/admin/appointments?page=1&limit=10
 */
export async function getAllAppointments(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const query = req.query as { page?: number; limit?: number };
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        skip,
        take: limit,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          astrologer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              category: true,
              appointmentFee: true,
              chatMessageCommissionPercent: true,
              broadcastMessageCommissionPercent: true,
              firstBroadcastCommissionPercent: true,
              kundaliReviewCommissionPercent: true,
              appointmentCommissionPercent: true,
            },
          },
        },
        orderBy: {
          scheduledAt: 'desc',
        },
      }),
      prisma.appointment.count(),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return sendSuccess(res, {
      appointments,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get appointment statistics (admin only)
 * GET /api/v1/admin/appointments/stats
 */
export async function getAppointmentStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const [total, pending, confirmed, completed, cancelled] = await Promise.all([
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: 'PENDING' } }),
      prisma.appointment.count({ where: { status: 'CONFIRMED' } }),
      prisma.appointment.count({ where: { status: 'COMPLETED' } }),
      prisma.appointment.count({ where: { status: 'CANCELLED' } }),
    ]);

    return sendSuccess(res, {
      total,
      pending,
      confirmed,
      completed,
      cancelled,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cancel an appointment (admin only)
 * POST /api/v1/admin/appointments/:id/cancel
 */
export async function cancelAppointment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { cancellationNote } = req.body ?? {};
    const cancelled = await appointmentService.cancelAppointment(id, cancellationNote);
    return sendSuccess(res, cancelled);
  } catch (error) {
    next(error);
  }
}

