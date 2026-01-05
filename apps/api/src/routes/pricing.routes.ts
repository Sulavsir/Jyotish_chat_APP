/**
 * Pricing Routes - Public pricing endpoints
 */

import { Router } from 'express';
import * as pricingController from '../controllers/pricingController';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

/**
 * @swagger
 * /api/v1/pricing:
 *   get:
 *     summary: Get all active pricing plans
 *     tags: [Pricing]
 *     responses:
 *       200:
 *         description: List of pricing plans
 */
router.get('/', asyncHandler(pricingController.getAllPlans));

/**
 * @swagger
 * /api/v1/pricing/featured:
 *   get:
 *     summary: Get featured pricing plans
 *     tags: [Pricing]
 *     responses:
 *       200:
 *         description: List of featured pricing plans
 */
router.get('/featured', asyncHandler(pricingController.getFeaturedPlans));

/**
 * @swagger
 * /api/v1/pricing/{id}:
 *   get:
 *     summary: Get pricing plan by ID
 *     tags: [Pricing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pricing plan details
 *       404:
 *         description: Pricing plan not found
 */
router.get('/:id', asyncHandler(pricingController.getPlanById));

export default router;


