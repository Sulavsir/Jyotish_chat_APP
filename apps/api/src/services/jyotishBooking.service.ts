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
  }) {
    return prisma.jyotishBookingRequest.create({
      data: {
        clientId: input.clientId,
        type: input.type,
        preferredAstrologerId: input.preferredAstrologerId,
        category: input.category,
        bookingDate: input.bookingDate,
        details: input.details,
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

  async listAdmin(input?: { type?: JyotishBookingType; status?: JyotishBookingStatus }) {
    return prisma.jyotishBookingRequest.findMany({
      where: {
        type: input?.type,
        status: input?.status,
      },
      orderBy: [{ createdAt: 'desc' }],
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
    });
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

