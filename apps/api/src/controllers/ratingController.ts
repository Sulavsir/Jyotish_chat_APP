/**
 * Rating Controller
 * Handles HTTP requests for rating-related operations
 */

import { Request, Response } from 'express';
import { HTTP_STATUS } from '../constants';
import * as ratingService from '../services/rating.service';
import { AuthRequest } from '../types/common.types';

/**
 * POST /api/v1/ratings
 * Create a new rating
 */
export const createRating = async (req: AuthRequest, res: Response) => {
  const { chatId, astrologerId, rating, feedback } = req.body;
  const clientId = req.user!.id;

  const newRating = await ratingService.createRating({
    chatId,
    clientId,
    astrologerId,
    rating,
    feedback,
  });

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data: { rating: newRating },
  });
};

/**
 * GET /api/v1/ratings/astrologer/:astrologerId
 * Get ratings for an astrologer
 */
export const getAstrologerRatings = async (req: Request, res: Response) => {
  const { astrologerId } = req.params;
  const limit = parseInt(req.query.limit as string) || 10;
  const page = parseInt(req.query.page as string) || 1;

  const result = await ratingService.getAstrologerRatings(astrologerId, limit, page);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result,
  });
};

/**
 * GET /api/v1/ratings/chat/:chatId
 * Get rating for a specific chat
 */
export const getChatRating = async (req: Request, res: Response) => {
  const { chatId } = req.params;

  const rating = await ratingService.getChatRating(chatId);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { rating },
  });
};

/**
 * GET /api/v1/ratings/my-ratings
 * Get ratings given by the current client
 */
export const getMyRatings = async (req: AuthRequest, res: Response) => {
  const clientId = req.user!.id;

  const ratings = await ratingService.getClientRatings(clientId);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { ratings },
  });
};

/**
 * GET /api/v1/ratings/can-rate/:chatId
 * Check if a chat can be rated
 */
export const canRateChat = async (req: AuthRequest, res: Response) => {
  const { chatId } = req.params;
  const clientId = req.user!.id;

  const result = await ratingService.canRateChat(chatId, clientId);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result,
  });
};

/**
 * GET /api/v1/ratings/astrologer/:astrologerId/stats
 * Get rating statistics for an astrologer
 */
export const getAstrologerRatingStats = async (req: Request, res: Response) => {
  const { astrologerId } = req.params;

  const stats = await ratingService.getAstrologerRatingStats(astrologerId);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { stats },
  });
};
