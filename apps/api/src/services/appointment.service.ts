/**
 * Appointment Service
 * Handles appointment booking and management
 */

import { prisma } from '@jyotish/database';
import { UserRole, AstrologerCategory } from '@jyotish/shared';
import { AppointmentStatus, Prisma } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import type {
  BookAppointmentData,
  UpdateAppointmentData,
  AppointmentWithRelations,
  TimeSlot,
} from '../types/appointment.types';

/**
 * Create a new appointment
 */
export const createAppointment = async (
  data: BookAppointmentData
): Promise<AppointmentWithRelations> => {
  // Validate astrologer can accept appointments
  const astrologer = await prisma.astrologer.findUnique({
    where: { id: data.astrologerId },
    select: {
      id: true,
      name: true,
      category: true,
      appointmentFee: true,
      isActive: true,
    },
  });

  if (!astrologer) {
    throw new Error('Astrologer not found');
  }

  if (!astrologer.isActive) {
    throw new Error('Astrologer is not active');
  }

  if (astrologer.category === AstrologerCategory.ORDINARY) {
    throw new Error('This astrologer does not accept appointments');
  }

  // Check if time slot is available
  const existingAppointment = await prisma.appointment.findFirst({
    where: {
      astrologerId: data.astrologerId,
      scheduledAt: data.scheduledAt,
      status: {
        in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
      },
    },
  });

  if (existingAppointment) {
    throw new Error('This time slot is already booked');
  }

  // Create the appointment
  const appointment = await prisma.appointment.create({
    data: {
      clientId: data.clientId,
      astrologerId: data.astrologerId,
      scheduledAt: data.scheduledAt,
      duration: data.duration,
      amount: data.amount,
      notes: data.notes || null,
      status: AppointmentStatus.PENDING,
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          profilePhoto: true,
        },
      },
      astrologer: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          profilePhoto: true,
          category: true,
          appointmentFee: true,
        },
      },
    },
  });

  // Emit new consultation event to admin for real-time stats (appointments count as consultations)
  const { AdminStatsEmitter } = require('../utils/admin-stats-emitter');
  AdminStatsEmitter.emitNewConsultation();

  return appointment as AppointmentWithRelations;
};

/**
 * Get appointments for a user (client or astrologer)
 */
export const listAppointments = async (input: {
  userId: string;
  role: UserRole.CLIENT | UserRole.ASTROLOGER;
  page: number;
  limit: number;
  search?: string;
  status?: AppointmentStatus;
}): Promise<{
  appointments: AppointmentWithRelations[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> => {
  const skip = (input.page - 1) * input.limit;
  const q = input.search?.trim();

  const baseWhere: Prisma.AppointmentWhereInput =
    input.role === UserRole.CLIENT ? { clientId: input.userId } : { astrologerId: input.userId };

  const where: Prisma.AppointmentWhereInput = {
    ...baseWhere,
    ...(input.status ? { status: input.status } : {}),
    ...(q
      ? {
          OR: [
            { notes: { contains: q, mode: 'insensitive' } },
            { cancellationNote: { contains: q, mode: 'insensitive' } },
            { client: { name: { contains: q, mode: 'insensitive' } } },
            { client: { phone: { contains: q, mode: 'insensitive' } } },
            { astrologer: { name: { contains: q, mode: 'insensitive' } } },
            { astrologer: { phone: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            profilePhoto: true,
          },
        },
        astrologer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            profilePhoto: true,
            category: true,
            appointmentFee: true,
          },
        },
      },
      orderBy: { scheduledAt: 'desc' },
      skip,
      take: input.limit,
    }),
    prisma.appointment.count({ where }),
  ]);

  return {
    appointments: appointments as AppointmentWithRelations[],
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / input.limit)),
    },
  };
};

// Backward-compatible helper (used elsewhere in API)
export const getAppointments = async (
  userId: string,
  role: UserRole.CLIENT | UserRole.ASTROLOGER,
  status?: AppointmentStatus
): Promise<AppointmentWithRelations[]> => {
  const result = await listAppointments({ userId, role, status, page: 1, limit: 1000 });
  return result.appointments;
};

/**
 * Get a single appointment by ID
 */
export const getAppointmentById = async (id: string): Promise<AppointmentWithRelations | null> => {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          profilePhoto: true,
        },
      },
      astrologer: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          profilePhoto: true,
          category: true,
          appointmentFee: true,
        },
      },
    },
  });

  return appointment as AppointmentWithRelations | null;
};

/**
 * Update appointment
 */
export const updateAppointment = async (
  id: string,
  data: UpdateAppointmentData
): Promise<AppointmentWithRelations> => {
  const updateData: {
    status?: AppointmentStatus;
    notes?: string | null;
    rating?: number | null;
    review?: string | null;
    cancellationNote?: string | null;
  } = {};

  if (data.status) {
    updateData.status = data.status as AppointmentStatus;
  }
  if (data.notes !== undefined) {
    updateData.notes = data.notes || null;
  }
  if (data.rating !== undefined) {
    updateData.rating = data.rating;
  }
  if (data.review !== undefined) {
    updateData.review = data.review || null;
  }
  if (data.cancellationNote !== undefined) {
    updateData.cancellationNote = data.cancellationNote || null;
  }

  const appointment = await prisma.appointment.update({
    where: { id },
    data: updateData,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          profilePhoto: true,
        },
      },
      astrologer: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          profilePhoto: true,
          category: true,
          appointmentFee: true,
        },
      },
    },
  });

  return appointment as AppointmentWithRelations;
};

/**
 * Check availability for an astrologer on a specific date
 * Returns time slots with availability status
 */
export const checkAvailability = async (
  astrologerId: string,
  date: string // YYYY-MM-DD format
): Promise<TimeSlot[]> => {
  // Validate astrologer
  const astrologer = await prisma.astrologer.findUnique({
    where: { id: astrologerId },
    select: {
      id: true,
      category: true,
      isActive: true,
    },
  });

  if (!astrologer) {
    throw new Error('Astrologer not found');
  }

  if (astrologer.category === AstrologerCategory.ORDINARY) {
    throw new Error('This astrologer does not accept appointments');
  }

  if (!astrologer.isActive) {
    throw new Error('Astrologer is not active');
  }

  // Generate time slots for the day (9 AM to 9 PM, 30-minute intervals)
  const timeSlots: TimeSlot[] = [];
  for (let hour = 9; hour <= 20; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 20 && minute === 30) break; // Stop at 9:00 PM
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push({ time, available: true });
    }
  }

  // Get existing appointments for this astrologer on this date
  const startOfDay = new Date(`${date}T00:00:00.000Z`);
  const endOfDay = new Date(`${date}T23:59:59.999Z`);

  const appointments = await prisma.appointment.findMany({
    where: {
      astrologerId,
      scheduledAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: {
        in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
      },
    },
    include: {
      client: {
        select: {
          name: true,
        },
      },
    },
  });

  // Mark booked time slots as unavailable
  appointments.forEach((appointment) => {
    const appointmentTime = new Date(appointment.scheduledAt);
    const timeStr = `${appointmentTime.getHours().toString().padStart(2, '0')}:${appointmentTime.getMinutes().toString().padStart(2, '0')}`;

    const slot = timeSlots.find((s) => s.time === timeStr);
    if (slot) {
      slot.available = false;
      slot.bookedBy = appointment.client.name || 'Someone';
    }
  });

  return timeSlots;
};

/**
 * Cancel an appointment (only PENDING or CONFIRMED can be cancelled)
 */
export const cancelAppointment = async (
  id: string,
  cancellationNote?: string
): Promise<AppointmentWithRelations> => {
  const existing = await getAppointmentById(id);
  if (!existing) {
    throw new AppError('Appointment not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  const cancellable: AppointmentStatus[] = [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED];
  if (!cancellable.includes(existing.status as AppointmentStatus)) {
    throw new AppError(
      `Appointment cannot be cancelled (current status: ${existing.status}). Only pending or confirmed appointments can be cancelled.`,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }
  return updateAppointment(id, {
    status: AppointmentStatus.CANCELLED,
    cancellationNote,
  });
};

/**
 * Confirm an appointment (by astrologer)
 */
export const confirmAppointment = async (id: string): Promise<AppointmentWithRelations> => {
  return updateAppointment(id, {
    status: AppointmentStatus.CONFIRMED,
  });
};
