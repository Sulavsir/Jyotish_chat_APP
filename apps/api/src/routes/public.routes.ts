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
import * as locationController from '../controllers/location.controller';
import * as kundaliMatchController from '../controllers/kundaliMatch.controller';
import {
  getNepaliDateQuerySchema,
  getEnglishDateQuerySchema,
  convertNepaliDatesBodySchema,
  adMonthQuerySchema,
  bsMonthQuerySchema,
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
router.get(
  '/nepali-date/english',
  validateQuery(getEnglishDateQuerySchema),
  asyncHandler(nepaliDateController.getEnglishByNepaliDate)
);
router.post(
  '/nepali-date/convert',
  validateBody(convertNepaliDatesBodySchema),
  asyncHandler(nepaliDateController.convertBulk)
);
router.get(
  '/nepali-date/ad-month',
  validateQuery(adMonthQuerySchema),
  asyncHandler(nepaliDateController.getAdMonth)
);
router.get(
  '/nepali-date/bs-month',
  validateQuery(bsMonthQuerySchema),
  asyncHandler(nepaliDateController.getBsMonth)
);

// ==================== Location (Nepal provinces & districts for place of birth) ====================
router.get('/location/provinces', asyncHandler(locationController.listProvinces));
router.get(
  '/location/provinces/:provinceId/districts',
  asyncHandler(locationController.listDistrictsByProvince)
);

// Premium Kundali Match — consultation question catalogue (stable IDs + Nepali copy)
router.get(
  '/kundali-match/premium-consultation-questions',
  asyncHandler(kundaliMatchController.listPublicPremiumConsultationQuestions)
);

export default router;
