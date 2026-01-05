/**
 * Pricing Controller - Handle pricing plan requests
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { pricingService } from '../services/pricing.service';
import { sendSuccess } from '../utils';
import { HTTP_STATUS } from '../constants';

/**
 * Get all pricing plans (public)
 * GET /api/v1/pricing
 */
export async function getAllPlans(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const plans = await pricingService.getAllPlans();
    return sendSuccess(res, { plans });
  } catch (error) {
    next(error);
  }
}

/**
 * Get featured pricing plans (public)
 * GET /api/v1/pricing/featured
 */
export async function getFeaturedPlans(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const plans = await pricingService.getFeaturedPlans();
    return sendSuccess(res, { plans });
  } catch (error) {
    next(error);
  }
}

/**
 * Get pricing plan by ID (public)
 * GET /api/v1/pricing/:id
 */
export async function getPlanById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const plan = await pricingService.getPlanById(id);
    return sendSuccess(res, { plan });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all pricing plans including inactive (admin only)
 * GET /api/v1/admin/pricing
 */
export async function getAllPlansAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const plans = await pricingService.getAllPlans(true);
    return sendSuccess(res, { plans });
  } catch (error) {
    next(error);
  }
}

/**
 * Create pricing plan (admin only)
 * POST /api/v1/admin/pricing
 */
export async function createPlan(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const plan = await pricingService.createPlan(req.body);
    return sendSuccess(res, { plan }, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
}

/**
 * Update pricing plan (admin only)
 * PUT /api/v1/admin/pricing/:id
 */
export async function updatePlan(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const plan = await pricingService.updatePlan(id, req.body);
    return sendSuccess(res, { plan });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete pricing plan (admin only)
 * DELETE /api/v1/admin/pricing/:id
 */
export async function deletePlan(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await pricingService.deletePlan(id);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle pricing plan status (admin only)
 * PATCH /api/v1/admin/pricing/:id/toggle
 */
export async function togglePlanStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const plan = await pricingService.togglePlanStatus(id);
    return sendSuccess(res, { plan });
  } catch (error) {
    next(error);
  }
}
