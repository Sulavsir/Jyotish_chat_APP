/**
 * Jyotish Booking Service (Pandit Ji / Vaastu Shastri)
 */

import { prisma, JyotishBookingStatus, JyotishBookingType } from '@jyotish/database';
import { AppError, ERROR_CODES, HTTP_STATUS } from '../utils';
import { subhaSahitService } from './subha-sahit.service';

export const jyotishBookingService = {
  async createForClient(input: {
    clientId: string;
    type: JyotishBookingType;
    preferredAstrologerId?: string;
    category: string;
    bookingDate: Date;
    details?: string;
    location: string;
  }) {
    // Validate booking date is not in the past (not yesterday or earlier)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDateOnly = new Date(input.bookingDate);
    bookingDateOnly.setHours(0, 0, 0, 0);

    if (bookingDateOnly < today) {
      throw new AppError(
        'Booking date cannot be in the past. Please select today or a future date.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    if (input.type === JyotishBookingType.PANDIT) {
      // Validate category is either a standard PANDIT category or a valid occasion
      const occasions = await subhaSahitService.getOccasions();
      const validCategories = [...occasions];

      if (!validCategories.includes(input.category)) {
        throw new AppError(
          'Invalid category for Pandit Ji booking. Please select a valid occasion or category.',
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR
        );
      }

      // Check if the date is a Subha Sahit date for the selected occasion/category
      const dateStr = bookingDateOnly.toISOString().split('T')[0];
      const availableDates = await subhaSahitService.getAvailableDates({
        dateFrom: dateStr,
        dateTo: dateStr,
        occasion: input.category, // Filter by the selected occasion/category
      });

      const isSubhaSahit = availableDates.some(
        (d) => d.date.toISOString().split('T')[0] === dateStr
      );

      if (!isSubhaSahit) {
        throw new AppError(
          `Pandit Ji bookings can only be made on Subha Sahit (auspicious) dates for "${input.category}". Please select a date from the available dates for this occasion.`,
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR
        );
      }

      // Check if the client already has a booking for this date
      const existingBooking = await prisma.jyotishBookingRequest.findFirst({
        where: {
          clientId: input.clientId,
          type: JyotishBookingType.PANDIT,
          bookingDate: bookingDateOnly,
          status: {
            in: [JyotishBookingStatus.PENDING, JyotishBookingStatus.APPROVED],
          },
        },
      });

      if (existingBooking) {
        throw new AppError(
          `You already have a Pandit Ji booking for ${dateStr}. You cannot book multiple times for the same date.`,
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
    }

    return prisma.jyotishBookingRequest.create({
      data: {
        clientId: input.clientId,
        type: input.type,
        preferredAstrologerId: input.preferredAstrologerId,
        category: input.category,
        bookingDate: input.bookingDate,
        details: input.details,
        location: input.location,
        status: JyotishBookingStatus.PENDING,
      },
    });
  },

  async listForClient(input: {
    clientId: string;
    page: number;
    limit: number;
    search?: string;
    type?: JyotishBookingType;
    status?: JyotishBookingStatus;
  }) {
    const skip = (input.page - 1) * input.limit;
    const q = input.search?.trim();

    const where = {
      clientId: input.clientId,
      type: input.type,
      status: input.status,
      ...(q
        ? {
            OR: [
              { category: { contains: q, mode: 'insensitive' as const } },
              { details: { contains: q, mode: 'insensitive' as const } },
              { location: { contains: q, mode: 'insensitive' as const } },
              { adminNotes: { contains: q, mode: 'insensitive' as const } },
              { preferredAstrologer: { name: { contains: q, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };

    const [bookings, total] = await Promise.all([
      prisma.jyotishBookingRequest.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: input.limit,
        include: {
          preferredAstrologer: {
            select: {
              id: true,
              name: true,
              category: true,
              specialization: true,
              profilePhoto: true,
            },
          },
        },
      }),
      prisma.jyotishBookingRequest.count({ where }),
    ]);

    return {
      bookings,
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / input.limit)),
      },
    };
  },

  async listAdmin(input?: {
    type?: JyotishBookingType;
    status?: JyotishBookingStatus;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const page = input?.page || 1;
    const limit = input?.limit || 10;
    const skip = (page - 1) * limit;
    const q = input?.search?.trim();

    const where: {
      type?: JyotishBookingType;
      status?: JyotishBookingStatus;
      OR?: Array<{
        category?: { contains: string; mode: 'insensitive' };
        details?: { contains: string; mode: 'insensitive' };
        location?: { contains: string; mode: 'insensitive' };
        adminNotes?: { contains: string; mode: 'insensitive' };
        client?: {
          OR: Array<{
            name?: { contains: string; mode: 'insensitive' };
            phone?: { contains: string; mode: 'insensitive' };
            email?: { contains: string; mode: 'insensitive' };
          }>;
        };
        preferredAstrologer?: { name?: { contains: string; mode: 'insensitive' } };
      }>;
    } = {
      ...(input?.type ? { type: input.type } : {}),
      ...(input?.status ? { status: input.status } : {}),
    };

    if (q) {
      where.OR = [
        { category: { contains: q, mode: 'insensitive' } },
        { details: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
        { adminNotes: { contains: q, mode: 'insensitive' } },
        {
          client: {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          },
        },
        { preferredAstrologer: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.jyotishBookingRequest.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limit,
        include: {
          client: {
            select: {
              id: true,
              phone: true,
              name: true,
              email: true,
              profilePhoto: true,
            },
          },
          preferredAstrologer: {
            select: {
              id: true,
              name: true,
              category: true,
              specialization: true,
              profilePhoto: true,
            },
          },
        },
      }),
      prisma.jyotishBookingRequest.count({ where }),
    ]);

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  async updateStatusAdmin(input: {
    id: string;
    status: JyotishBookingStatus;
    adminNotes?: string;
  }) {
    const existing = await prisma.jyotishBookingRequest.findUnique({ where: { id: input.id } });
    if (!existing) {
      throw new AppError('Booking request not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    return prisma.jyotishBookingRequest.update({
      where: { id: input.id },
      data: {
        status: input.status,
        adminNotes: input.adminNotes,
        decidedAt:
          input.status === JyotishBookingStatus.APPROVED ||
          input.status === JyotishBookingStatus.REJECTED
            ? new Date()
            : null,
      },
    });
  },
};
