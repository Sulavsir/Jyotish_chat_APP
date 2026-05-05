/**
 * Jyotish Booking Service (Pandit Ji / Vaastu Shastri)
 */

import { prisma, JyotishBookingStatus, JyotishBookingType, SubhaSahitLanguage } from '@jyotish/database';
import { buildJyotishBookingLocationSummary } from '@jyotish/shared';
import { AppError, ERROR_CODES, HTTP_STATUS } from '../utils';
import { notifyClientJyotishBookingDecision } from './jyotishBookingNotification.service';

const SUBHA_META_LANG_PRIORITY: readonly SubhaSahitLanguage[] = ['EN', 'NE', 'HI'];

function pickOccasionMetaForCategory(
  metas: Array<{
    language: SubhaSahitLanguage;
    occasion: string;
    pujaItems: string | null;
    estimatedTime: string | null;
  }>,
  category: string
): { pujaItems: string | null; estimatedTime: string | null } | null {
  const low = category.trim().toLowerCase();
  const matches = metas.filter((m) => m.occasion.trim().toLowerCase() === low);
  if (matches.length === 0) return null;
  for (const lang of SUBHA_META_LANG_PRIORITY) {
    const hit = matches.find((m) => m.language === lang);
    if (hit) return { pujaItems: hit.pujaItems, estimatedTime: hit.estimatedTime };
  }
  return { pujaItems: matches[0].pujaItems, estimatedTime: matches[0].estimatedTime };
}

export const jyotishBookingService = {
  async createForClient(input: {
    clientId: string;
    type: JyotishBookingType;
    preferredAstrologerId?: string;
    category: string;
    bookingDate: Date;
    details?: string;
    province: string;
    district: string;
    wardNo: string;
    place: string;
    tole?: string;
    nearestLandmark?: string;
    googleMapLink?: string;
    pujariCount: number;
    contactPhone: string;
    contactPhoneAlt?: string;
  }) {
    // Normalize dates to UTC for consistent comparison
    // Extract date string from the input date (which is already UTC from controller)
    const bookingDateStr = input.bookingDate.toISOString().split('T')[0];
    const bookingDateUTC = new Date(`${bookingDateStr}T00:00:00.000Z`);
    
    // Get today's date in UTC
    const todayUTC = new Date();
    todayUTC.setUTCHours(0, 0, 0, 0);
    const todayStr = todayUTC.toISOString().split('T')[0];

    // Validate booking date is not in the past (not yesterday or earlier)
    if (bookingDateStr < todayStr) {
      throw new AppError(
        'Booking date cannot be in the past. Please select today or a future date.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const categoryToStore = input.category.trim();

    const tole = input.tole?.trim() || null;
    const nearestLandmark = input.nearestLandmark?.trim() || null;
    const googleMapLink = input.googleMapLink?.trim() || null;
    const contactPhoneAlt = input.contactPhoneAlt?.trim() || null;

    const locationSummary = buildJyotishBookingLocationSummary({
      province: input.province,
      district: input.district,
      wardNo: input.wardNo,
      place: input.place,
      tole,
      nearestLandmark,
    });

    return prisma.jyotishBookingRequest.create({
      data: {
        clientId: input.clientId,
        type: input.type,
        preferredAstrologerId: input.preferredAstrologerId,
        category: categoryToStore,
        bookingDate: bookingDateUTC, // Use normalized UTC date
        details: input.details,
        location: locationSummary,
        province: input.province.trim(),
        district: input.district.trim(),
        wardNo: input.wardNo.trim(),
        place: input.place.trim(),
        tole,
        nearestLandmark,
        googleMapLink,
        pujariCount: input.pujariCount,
        contactPhone: input.contactPhone,
        contactPhoneAlt,
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
    dateFrom?: string;
    dateTo?: string;
  }) {
    const skip = (input.page - 1) * input.limit;
    const q = input.search?.trim();

    const createdAt =
      input.dateFrom || input.dateTo
        ? {
            ...(input.dateFrom ? { gte: new Date(`${input.dateFrom}T00:00:00.000Z`) } : {}),
            ...(input.dateTo ? { lte: new Date(`${input.dateTo}T23:59:59.999Z`) } : {}),
          }
        : undefined;

    const where = {
      clientId: input.clientId,
      type: input.type,
      status: input.status,
      ...(createdAt ? { createdAt } : {}),
      ...(q
        ? {
            OR: [
              { category: { contains: q, mode: 'insensitive' as const } },
              { details: { contains: q, mode: 'insensitive' as const } },
              { location: { contains: q, mode: 'insensitive' as const } },
              { province: { contains: q, mode: 'insensitive' as const } },
              { district: { contains: q, mode: 'insensitive' as const } },
              { wardNo: { contains: q, mode: 'insensitive' as const } },
              { place: { contains: q, mode: 'insensitive' as const } },
              { tole: { contains: q, mode: 'insensitive' as const } },
              { nearestLandmark: { contains: q, mode: 'insensitive' as const } },
              { contactPhone: { contains: q, mode: 'insensitive' as const } },
              { contactPhoneAlt: { contains: q, mode: 'insensitive' as const } },
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

    const panditCategories = [
      ...new Set(
        bookings
          .filter((b) => b.type === JyotishBookingType.PANDIT)
          .map((b) => b.category.trim())
          .filter(Boolean)
      ),
    ];

    let occasionMetas: Array<{
      language: SubhaSahitLanguage;
      occasion: string;
      pujaItems: string | null;
      estimatedTime: string | null;
    }> = [];

    if (panditCategories.length > 0) {
      occasionMetas = await prisma.subhaSahitOccasionMeta.findMany({
        where: {
          OR: panditCategories.map((c) => ({
            occasion: { equals: c, mode: 'insensitive' },
          })),
        },
        select: {
          language: true,
          occasion: true,
          pujaItems: true,
          estimatedTime: true,
        },
      });
    }

    const bookingsOut = bookings.map((b) => {
      if (b.type !== JyotishBookingType.PANDIT) {
        return b;
      }
      const meta = pickOccasionMetaForCategory(occasionMetas, b.category);
      return {
        ...b,
        occasionKey: b.category.trim().toLowerCase(),
        pujaItems: meta?.pujaItems ?? null,
        estimatedTime: meta?.estimatedTime ?? null,
      };
    });

    return {
      bookings: bookingsOut,
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
        province?: { contains: string; mode: 'insensitive' };
        district?: { contains: string; mode: 'insensitive' };
        wardNo?: { contains: string; mode: 'insensitive' };
        place?: { contains: string; mode: 'insensitive' };
        tole?: { contains: string; mode: 'insensitive' };
        nearestLandmark?: { contains: string; mode: 'insensitive' };
        contactPhone?: { contains: string; mode: 'insensitive' };
        contactPhoneAlt?: { contains: string; mode: 'insensitive' };
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
        { province: { contains: q, mode: 'insensitive' } },
        { district: { contains: q, mode: 'insensitive' } },
        { wardNo: { contains: q, mode: 'insensitive' } },
        { place: { contains: q, mode: 'insensitive' } },
        { tole: { contains: q, mode: 'insensitive' } },
        { nearestLandmark: { contains: q, mode: 'insensitive' } },
        { contactPhone: { contains: q, mode: 'insensitive' } },
        { contactPhoneAlt: { contains: q, mode: 'insensitive' } },
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

    const updated = await prisma.jyotishBookingRequest.update({
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

    void notifyClientJyotishBookingDecision({
      clientId: existing.clientId,
      bookingId: updated.id,
      bookingType: existing.type,
      category: existing.category,
      bookingDateIso: updated.bookingDate,
      nextStatus: input.status,
      previousStatus: existing.status,
    });

    return updated;
  },
};
