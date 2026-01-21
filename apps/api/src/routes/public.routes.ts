/**
 * Public Routes
 * No authentication required
 */

import { Router } from 'express';
import { asyncHandler } from '../utils';
import * as publicAstrologerController from '../controllers/publicAstrologerController';
import * as dashboardRotatingCopyController from '../controllers/dashboardRotatingCopyController';

const router = Router();

// ==================== Public Astrologer Routes ====================
router.get('/astrologers', asyncHandler(publicAstrologerController.listPublicAstrologers));
router.get('/astrologers/stats', asyncHandler(publicAstrologerController.getAstrologerStats));
router.get('/astrologers/:id', asyncHandler(publicAstrologerController.getPublicAstrologerProfile));

// ==================== Public Dashboard Routes ====================
router.get(
  '/dashboard-rotating-copy',
  asyncHandler(dashboardRotatingCopyController.listPublic)
);

export default router;

