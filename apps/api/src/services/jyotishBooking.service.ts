/**
 * Jyotish Booking Service (Pandit Ji / Vaastu Shastri)
 */

import { prisma, JyotishBookingStatus, JyotishBookingType } from '@jyotish/database';
import { AppError, ERROR_CODES, HTTP_STATUS } from '../utils';

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

