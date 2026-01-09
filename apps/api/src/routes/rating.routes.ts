/**
 * Rating Routes
 * Routes for astrologer rating operations
 */

import { Router } from 'express';
import * as ratingController from '../controllers/ratingController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/v1/ratings - Create a new rating
router.post('/', asyncHandler(ratingController.createRating));

// GET /api/v1/ratings/my-ratings - Get ratings given by current client
router.get('/my-ratings', asyncHandler(ratingController.getMyRatings));

// GET /api/v1/ratings/can-rate/:chatId - Check if chat can be rated
router.get('/can-rate/:chatId', asyncHandler(ratingController.canRateChat));

// GET /api/v1/ratings/chat/:chatId - Get rating for a specific chat
router.get('/chat/:chatId', asyncHandler(ratingController.getChatRating));

// GET /api/v1/ratings/astrologer/:astrologerId - Get ratings for an astrologer
router.get('/astrologer/:astrologerId', asyncHandler(ratingController.getAstrologerRatings));

// GET /api/v1/ratings/astrologer/:astrologerId/stats - Get rating stats for an astrologer
router.get('/astrologer/:astrologerId/stats', asyncHandler(ratingController.getAstrologerRatingStats));

export default router;
