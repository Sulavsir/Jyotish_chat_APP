/**
 * Kundali Match Controller
 * Client: create request, list mine. Admin: list all, get one, submit review.
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils';
import { HTTP_STATUS } from '../constants';
import * as kundaliMatchService from '../services/kundaliMatch.service';

/**
 * Client: create kundali match request (deducts coins).
 * POST /api/v1/kundali-match
 */
export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
    }
    const body = req.body as {
      boyDateOfBirth: string;
      boyTimeOfBirth: string;
      boyPlaceOfBirth: string;
      girlDateOfBirth: string;
      girlTimeOfBirth: string;
      girlPlaceOfBirth: string;
    };
    const request = await kundaliMatchService.createRequest({
      userId,
      boyDateOfBirth: body.boyDateOfBirth,
      boyTimeOfBirth: body.boyTimeOfBirth,
      boyPlaceOfBirth: body.boyPlaceOfBirth,
      girlDateOfBirth: body.girlDateOfBirth,
      girlTimeOfBirth: body.girlTimeOfBirth,
      girlPlaceOfBirth: body.girlPlaceOfBirth,
    });
    return sendSuccess(
      res,
      {
        request,
        message: 'Kundali Match Request Submitted. You will get the report shortly.',
      },
      HTTP_STATUS.CREATED
    );
  } catch (e) {
    next(e);
  }
}

/**
 * Client: list my kundali match requests.
 * GET /api/v1/kundali-match/my
 */
export async function listMine(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
    }
    const query = req.query as { page?: number; limit?: number; status?: string };
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
    const result = await kundaliMatchService.listMine(userId, {
      page,
      limit,
      status: query.status as 'PENDING' | 'REVIEWED' | undefined,
    });
    return sendSuccess(res, result);
  } catch (e) {
    next(e);
  }
}

/**
 * Admin: list all kundali match requests (paginated).
 * GET /api/v1/admin/kundali-match
 */
export async function listAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const query = req.query as { page?: number; limit?: number; status?: string };
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const result = await kundaliMatchService.listAdmin({
      page,
      limit,
      status: query.status as 'PENDING' | 'REVIEWED' | undefined,
    });
    return sendSuccess(res, result);
  } catch (e) {
    next(e);
  }
}

/**
 * Admin: get single kundali match request.
 * GET /api/v1/admin/kundali-match/:id
 */
export async function getByIdAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const request = await kundaliMatchService.getById(id);
    if (!request) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Request not found' });
    }
    return sendSuccess(res, { request });
  } catch (e) {
    next(e);
  }
}

/**
 * Admin: submit review (text message).
 * POST /api/v1/admin/kundali-match/:id/review
 */
export async function submitReview(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
    }
    const { id } = req.params;
    const { adminReviewMessage } = req.body as { adminReviewMessage: string };
    const request = await kundaliMatchService.submitReview(id, adminId, adminReviewMessage);
    return sendSuccess(res, { request });
  } catch (e) {
    next(e);
  }
}
