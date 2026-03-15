/**
 * Kundali Match Controller
 * Client: create request, list mine. Admin: list all, get one, submit review.
 * Place of birth: structured (province, district, place for Nepal; single string for outside).
 */

import { Response, NextFunction } from 'express';
import { prisma } from '@jyotish/database';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils';
import { HTTP_STATUS } from '../constants';
import * as kundaliMatchService from '../services/kundaliMatch.service';

type ValidatedBody = {
  boyDateOfBirth: string;
  boyTimeOfBirth: string;
  boyPlaceOfBirthType: 'NEPAL' | 'OUTSIDE_NEPAL';
  boyPlaceOfBirthPradeshId: string | null;
  boyPlaceOfBirthDistrictId: string | null;
  boyPlaceOfBirthLocation: string | null;
  boyPlaceOfBirth: string | null;
  girlDateOfBirth: string;
  girlTimeOfBirth: string;
  girlPlaceOfBirthType: 'NEPAL' | 'OUTSIDE_NEPAL';
  girlPlaceOfBirthPradeshId: string | null;
  girlPlaceOfBirthDistrictId: string | null;
  girlPlaceOfBirthLocation: string | null;
  girlPlaceOfBirth: string | null;
};

async function buildPlaceOfBirthString(
  type: 'NEPAL' | 'OUTSIDE_NEPAL',
  pradeshId: string | null,
  districtId: string | null,
  location: string | null,
  outsideText: string | null
): Promise<string> {
  if (type === 'OUTSIDE_NEPAL') {
    return (outsideText && outsideText.trim()) || '';
  }
  if (!pradeshId || !districtId) return '';
  const [district, province] = await Promise.all([
    prisma.nepalGeography.findUnique({ where: { id: districtId }, select: { nameEn: true } }),
    prisma.nepalGeography.findUnique({ where: { id: pradeshId }, select: { nameEn: true } }),
  ]);
  const parts = [
    province?.nameEn ?? '',
    district?.nameEn ?? '',
    (location && location.trim()) ?? '',
  ].filter(Boolean);
  return parts.join(', ');
}

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
    const body = req.body as ValidatedBody;
    const [boyPlaceOfBirth, girlPlaceOfBirth] = await Promise.all([
      buildPlaceOfBirthString(
        body.boyPlaceOfBirthType,
        body.boyPlaceOfBirthPradeshId,
        body.boyPlaceOfBirthDistrictId,
        body.boyPlaceOfBirthLocation,
        body.boyPlaceOfBirth
      ),
      buildPlaceOfBirthString(
        body.girlPlaceOfBirthType,
        body.girlPlaceOfBirthPradeshId,
        body.girlPlaceOfBirthDistrictId,
        body.girlPlaceOfBirthLocation,
        body.girlPlaceOfBirth
      ),
    ]);
    const request = await kundaliMatchService.createRequest({
      userId,
      boyDateOfBirth: body.boyDateOfBirth,
      boyTimeOfBirth: body.boyTimeOfBirth,
      boyPlaceOfBirth,
      girlDateOfBirth: body.girlDateOfBirth,
      girlTimeOfBirth: body.girlTimeOfBirth,
      girlPlaceOfBirth,
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
