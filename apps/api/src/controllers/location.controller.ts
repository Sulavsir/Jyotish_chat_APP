/**
 * Location controller – Nepal geography (provinces and districts) for place of birth
 *
 * Duplicate provinces are prevented by DB (partial unique index) + seed; no runtime dedupe needed.
 */

import { Response } from 'express';
import { prisma, GeographyType } from '@jyotish/database';
import { sendSuccess, sendError } from '../utils';
import { HTTP_STATUS } from '../constants';

/**
 * GET /api/v1/public/location/provinces
 * List all Nepal provinces (English names)
 */
export async function listProvinces(_req: unknown, res: Response) {
  try {
    if (!('nepalGeography' in prisma)) {
      return sendSuccess(res, []);
    }
    const provinces = await prisma.nepalGeography.findMany({
      where: { type: GeographyType.PROVINCE, parentId: null },
      orderBy: { nameEn: 'asc' },
      select: { id: true, nameEn: true },
    });
    return sendSuccess(res, provinces);
  } catch (error) {
    console.error('Error listing provinces:', error);
    return sendError(res, 'Failed to list provinces', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * GET /api/v1/public/location/provinces/:provinceId/districts
 * List districts for a province (English names)
 */
export async function listDistrictsByProvince(
  req: { params: { provinceId?: string } },
  res: Response
) {
  try {
    const provinceId = req.params?.provinceId;
    if (!provinceId) {
      return sendError(res, 'Province ID is required', HTTP_STATUS.BAD_REQUEST);
    }
    if (!('nepalGeography' in prisma)) {
      return sendSuccess(res, []);
    }
    const districts = await prisma.nepalGeography.findMany({
      where: { type: GeographyType.DISTRICT, parentId: provinceId },
      orderBy: { nameEn: 'asc' },
      select: { id: true, nameEn: true, parentId: true },
    });
    return sendSuccess(res, districts);
  } catch (error) {
    console.error('Error listing districts:', error);
    return sendError(res, 'Failed to list districts', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}
