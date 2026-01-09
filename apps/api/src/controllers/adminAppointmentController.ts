/**
 * Admin Appointment Controller
 * Handles admin viewing all appointments
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils';
import { prisma } from '@jyotish/database';

/**
 * Get all appointments (admin only)
 * GET /api/v1/admin/appointments
 */
export async function getAllAppointments(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const appointments = await prisma.appointment.findMany({
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
          },
        },
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    });

    return sendSuccess(res, appointments);
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

