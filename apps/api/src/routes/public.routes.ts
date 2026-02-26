/**
 * Public Routes
 * No authentication required
 */

import { Router } from 'express';
import { listPublicQuestionnairesQuerySchema } from '@jyotish/shared';
import { validateQuery, validateBody } from '../middleware/validate';
import { asyncHandler } from '../utils';
import * as publicAstrologerController from '../controllers/publicAstrologerController';
import * as dashboardRotatingCopyController from '../controllers/dashboardRotatingCopyController';
import * as questionnaireController from '../controllers/questionnaireController';
import * as nepaliDateController from '../controllers/nepali-date.controller';
import {
  getNepaliDateQuerySchema,
  convertNepaliDatesBodySchema,
} from '../validators/nepali-date.validators';

const router = Router();

// ==================== Public Astrologer Routes ====================
router.get('/astrologers', asyncHandler(publicAstrologerController.listPublicAstrologers));
router.get('/astrologers/stats', asyncHandler(publicAstrologerController.getAstrologerStats));
router.get('/astrologers/:id', asyncHandler(publicAstrologerController.getPublicAstrologerProfile));

// ==================== Public Dashboard Routes ====================
router.get('/dashboard-rotating-copy', asyncHandler(dashboardRotatingCopyController.listPublic));

// ==================== Public Questionnaires (Question categories and questions) ====================
router.get(
  '/questionnaires',
  validateQuery(listPublicQuestionnairesQuerySchema),
  asyncHandler(questionnaireController.listPublicQuestionnaires)
);

// ==================== Public Nepali Date (English ↔ Bikram Sambat) ====================
router.get(
  '/nepali-date',
  validateQuery(getNepaliDateQuerySchema),
  asyncHandler(nepaliDateController.getByDate)
);
router.post(
  '/nepali-date/convert',
  validateBody(convertNepaliDatesBodySchema),
  asyncHandler(nepaliDateController.convertBulk)
);

export default router;
