/**
 * Public Astrologer Controller
 * Handles public-facing astrologer endpoints (no auth required)
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '@jyotish/database';
import { AppError, sendSuccess, HTTP_STATUS, ERROR_CODES } from '../utils';
import { AstrologerCategory } from '@jyotish/database';

/**
 * Get public astrologer profile by ID
 * GET /api/v1/public/astrologers/:id
 */
export async function getPublicAstrologerProfile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;

    const astrologer = await prisma.astrologer.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        profilePhoto: true,
        bio: true,
        category: true,
        specialization: true,
        experience: true,
        languages: true,
        gender: true,
        appointmentFee: true,
        isOnline: true,
        isActive: true,
        rating: true,
        totalConsultations: true,
        createdAt: true,
      },
    });

    if (!astrologer) {
      throw new AppError('Astrologer not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    if (!astrologer.isActive) {
      throw new AppError(
        'This astrologer profile is not available',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.NOT_FOUND
      );
    }

    return sendSuccess(res, { astrologer });
  } catch (error) {
    next(error);
  }
}

/**
 * List all astrologers with filters
 * GET /api/v1/public/astrologers
 */
export async function listPublicAstrologers(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      category,
      forAppointments,
      minRating,
      maxAppointmentFee,
      isOnline,
      search,
      sortBy = 'rating',
      sortOrder = 'desc',
      page = '1',
      limit = '20',
    } = req.query;

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (category) {
      where.category = category as AstrologerCategory;
    }

    // If requesting astrologers for appointment booking,
    // filter to PROFESSIONAL and PREMIUM only (ORDINARY cannot accept appointments).
    if (forAppointments === 'true') {
      where.category = {
        in: [AstrologerCategory.PROFESSIONAL, AstrologerCategory.PREMIUM],
      };
    }

    if (minRating) {
      where.rating = {
        gte: parseFloat(minRating as string),
      };
    }

    if (maxAppointmentFee) {
      where.appointmentFee = {
        lte: parseFloat(maxAppointmentFee as string),
      };
    }

    if (isOnline === 'true') {
      where.isOnline = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { specialization: { has: search as string } },
        { languages: { has: search as string } },
      ];
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'rating') {
      orderBy.rating = sortOrder;
    } else if (sortBy === 'experience') {
      orderBy.experience = sortOrder;
    } else if (sortBy === 'appointmentFee') {
      orderBy.appointmentFee = sortOrder;
    } else if (sortBy === 'totalConsultations') {
      orderBy.totalConsultations = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [astrologers, total] = await Promise.all([
      prisma.astrologer.findMany({
        where,
        select: {
          id: true,
          name: true,
          profilePhoto: true,
          bio: true,
          category: true,
          specialization: true,
          experience: true,
          languages: true,
          gender: true,
          appointmentFee: true,
          isOnline: true,
          rating: true,
          totalConsultations: true,
        },
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.astrologer.count({ where }),
    ]);

    return sendSuccess(res, {
      astrologers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasMore: skip + astrologers.length < total,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get astrologer statistics
 * GET /api/v1/public/astrologers/stats
 */
export async function getAstrologerStats(req: Request, res: Response, next: NextFunction) {
  try {
    const [total, online, byCategory] = await Promise.all([
      prisma.astrologer.count({ where: { isActive: true } }),
      prisma.astrologer.count({ where: { isActive: true, isOnline: true } }),
      prisma.astrologer.groupBy({
        by: ['category'],
        where: { isActive: true },
        _count: true,
      }),
    ]);

    const categoryStats = byCategory.reduce(
      (acc, item) => {
        acc[item.category] = item._count;
        return acc;
      },
      {} as Record<string, number>
    );

    return sendSuccess(res, {
      total,
      online,
      offline: total - online,
      byCategory: categoryStats,
    });
  } catch (error) {
    next(error);
  }
}

