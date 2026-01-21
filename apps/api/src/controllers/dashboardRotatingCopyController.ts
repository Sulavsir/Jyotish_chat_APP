/**
 * Dashboard Rotating Copy Controller
 */

import type { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils';
import { dashboardRotatingCopyService } from '../services/dashboardRotatingCopy.service';
import type { AuthRequest } from '../types';

/**
 * Public: List active rotating copy
 * GET /api/v1/public/dashboard-rotating-copy
 */
export async function listPublic(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await dashboardRotatingCopyService.listPublic();
    return sendSuccess(res, { items });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: List all rotating copy
 * GET /api/v1/admin/dashboard/rotating-copy
 */
export async function listAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const items = await dashboardRotatingCopyService.listAdmin();
    return sendSuccess(res, { items });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Create rotating copy
 * POST /api/v1/admin/dashboard/rotating-copy
 */
export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const created = await dashboardRotatingCopyService.create(req.body);
    return sendSuccess(res, { item: created });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Update rotating copy
 * PATCH /api/v1/admin/dashboard/rotating-copy/:id
 */
export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const updated = await dashboardRotatingCopyService.update(id, req.body);
    return sendSuccess(res, { item: updated });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Toggle rotating copy active state
 * PATCH /api/v1/admin/dashboard/rotating-copy/:id/toggle
 */
export async function toggle(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const updated = await dashboardRotatingCopyService.toggle(id);
    return sendSuccess(res, { item: updated });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Delete rotating copy
 * DELETE /api/v1/admin/dashboard/rotating-copy/:id
 */
export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await dashboardRotatingCopyService.remove(id);
    return sendSuccess(res, { message: 'Deleted successfully' });
  } catch (error) {
    next(error);
  }
}

