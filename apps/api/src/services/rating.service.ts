/**
 * Rating Service
 * Handles business logic for astrologer ratings
 */

import { prisma, AuditAction } from '@jyotish/database';
import { AppError } from '../middleware/error-handler';
import { ERROR_CODES, HTTP_STATUS } from '../constants';
import { logAudit } from '@/utils';

interface CreateRatingParams {
  chatId: string;
  clientId: string;
  astrologerId: string;
  rating: number;
  feedback?: string;
}

/**
 * Create a new rating for an astrologer
 */
export const createRating = async (params: CreateRatingParams) => {
  const { chatId, clientId, astrologerId, rating, feedback } = params;

  // Validate rating value
  if (rating < 1 || rating > 5) {
    throw new AppError(
      'Rating must be between 1 and 5 stars',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // Check if chat exists and belongs to the client
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      rating: true,
    },
  });

  if (!chat) {
    throw new AppError('Chat not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  // Ensure the client is a participant in this chat
  if (chat.participant1Id !== clientId) {
    throw new AppError(
      'You can only rate chats you participated in',
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.FORBIDDEN
    );
  }

  // Ensure the astrologer is the other participant
  if (chat.participant2Id !== astrologerId) {
    throw new AppError(
      'Invalid astrologer for this chat',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // Check if chat has ended
  if (chat.status !== 'ENDED') {
    throw new AppError(
      'You can only rate after the chat has ended',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const includeRating = {
    client: {
      select: {
        id: true,
        name: true,
        profilePhoto: true,
      },
    },
    astrologer: {
      select: {
        id: true,
        name: true,
        profilePhoto: true,
      },
    },
  } as const;

  const newRating = chat.rating
    ? await prisma.rating.update({
        where: { chatId },
        data: {
          rating,
          feedback: feedback ?? null,
        },
        include: includeRating,
      })
    : await prisma.rating.create({
        data: {
          chatId,
          clientId,
          astrologerId,
          rating,
          feedback,
        },
        include: includeRating,
      });

  // Update astrologer's aggregate rating
  await updateAstrologerRating(astrologerId);

  // Log audit (schema has RATING_CREATE only; include isUpdate in metadata)
  await logAudit({
    action: AuditAction.RATING_CREATE,
    resource: 'rating',
    resourceId: newRating.id,
    userId: clientId,
    metadata: {
      ratingId: newRating.id,
      chatId,
      astrologerId,
      rating,
      isUpdate: !!chat.rating,
      previousRating: chat.rating?.rating,
    },
  });

  return newRating;
};

/**
 * Get ratings for an astrologer
 */
export const getAstrologerRatings = async (astrologerId: string, limit = 10, page = 1) => {
  const skip = (page - 1) * limit;

  const [ratings, total] = await Promise.all([
    prisma.rating.findMany({
      where: { astrologerId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    }),
    prisma.rating.count({
      where: { astrologerId },
    }),
  ]);

  return {
    ratings,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + ratings.length < total,
    },
  };
};

/**
 * Get rating for a specific chat
 */
export const getChatRating = async (chatId: string) => {
  const rating = await prisma.rating.findUnique({
    where: { chatId },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          profilePhoto: true,
        },
      },
      astrologer: {
        select: {
          id: true,
          name: true,
          profilePhoto: true,
        },
      },
    },
  });

  return rating;
};

/**
 * Get ratings given by a client
 */
export const getClientRatings = async (clientId: string) => {
  const ratings = await prisma.rating.findMany({
    where: { clientId },
    include: {
      astrologer: {
        select: {
          id: true,
          name: true,
          profilePhoto: true,
        },
      },
      chat: {
        select: {
          id: true,
          createdAt: true,
          endedAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return ratings;
};

/**
 * Update astrologer's aggregate rating
 */
export const updateAstrologerRating = async (astrologerId: string) => {
  const result = await prisma.rating.aggregate({
    where: { astrologerId },
    _avg: {
      rating: true,
    },
    _count: {
      rating: true,
    },
  });

  const avgRating = result._avg.rating || 0;

  await prisma.astrologer.update({
    where: { id: astrologerId },
    data: {
      rating: avgRating,
    },
  });

  return {
    averageRating: avgRating,
    totalRatings: result._count.rating,
  };
};

/**
 * Check if a chat can be rated
 */
export const canRateChat = async (
  chatId: string,
  clientId: string
): Promise<{
  canRate: boolean;
  reason?: string;
}> => {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      rating: true,
    },
  });

  if (!chat) {
    return { canRate: false, reason: 'Chat not found' };
  }

  if (chat.participant1Id !== clientId) {
    return { canRate: false, reason: 'You are not a participant in this chat' };
  }

  if (chat.status !== 'ENDED') {
    return { canRate: false, reason: 'Chat has not ended yet' };
  }

  return { canRate: true };
};

/**
 * Get rating statistics for an astrologer
 */
export const getAstrologerRatingStats = async (astrologerId: string) => {
  const [ratings, ratingDistribution] = await Promise.all([
    prisma.rating.aggregate({
      where: { astrologerId },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    }),
    prisma.rating.groupBy({
      by: ['rating'],
      where: { astrologerId },
      _count: {
        rating: true,
      },
    }),
  ]);

  // Create distribution object with all star ratings (1-5)
  const distribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  ratingDistribution.forEach((item) => {
    distribution[item.rating as keyof typeof distribution] = item._count.rating;
  });

  return {
    averageRating: ratings._avg.rating || 0,
    totalRatings: ratings._count.rating,
    distribution,
  };
};
