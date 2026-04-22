/**
 * Subha Sahit Controller - Auspicious dates for Pandit Ji bookings
 */

import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils';
import { subhaSahitService } from '../services/subha-sahit.service';

/**
 * Public: Get available dates for Pandit Ji booking
 * GET /api/v1/subha-sahit/available
 */
export const getAvailableDates = async (req: Request, res: Response, next: NextFunction) => {
  const { occasion, dateFrom, dateTo, language } = req.query as {
    occasion?: string;
    dateFrom?: string;
    dateTo?: string;
    language?: string;
  };

  const dates = await subhaSahitService.getAvailableDates({
    occasion,
    dateFrom,
    dateTo,
    language,
  });

  return sendSuccess(res, { dates });
};

/**
 * Occasions for Subha Sahit (puja items & estimated time for Book Pujari Ji)
 * Public: GET /api/v1/subha-sahit/occasions · Admin: GET /api/v1/admin/subha-sahit/occasions
 */
export const getOccasions = async (req: Request, res: Response, next: NextFunction) => {
  const { language } = req.query as { language?: string };
  const occasions = await subhaSahitService.listOccasionsWithMeta(language);
  return sendSuccess(res, { occasions });
};

/**
 * Admin: Create a new Subha Sahit occasion
 * POST /api/v1/admin/subha-sahit/occasions
 */
export const createOccasion = async (req: Request, res: Response, next: NextFunction) => {
  const { name, language, pujaItems, estimatedTime } = req.body as {
    name: string;
    language?: string;
    pujaItems?: string | null;
    estimatedTime?: string | null;
  };
  const occasion = await subhaSahitService.createOccasion(name, language, { pujaItems, estimatedTime });
  return sendSuccess(res, { occasion });
};

/**
 * Admin: Set or update puja items and estimated time for an occasion
 * PUT /api/v1/admin/subha-sahit/occasion-meta
 */
export const updateOccasionMeta = async (req: Request, res: Response, next: NextFunction) => {
  const { language, occasion, pujaItems, estimatedTime } = req.body as {
    language: string;
    occasion: string;
    pujaItems?: string | null;
    estimatedTime?: string | null;
  };
  await subhaSahitService.upsertOccasionMeta(language, occasion, { pujaItems, estimatedTime });
  return sendSuccess(res, { message: 'Occasion details updated' });
};

/**
 * Admin: delete occasion (placeholder rows + meta). 409 if real Subha Sahit dates reference it.
 * DELETE /api/v1/admin/subha-sahit/occasions
 */
export const deleteOccasion = async (req: Request, res: Response, next: NextFunction) => {
  const { language, occasion } = req.body as { language: string; occasion: string };
  await subhaSahitService.deleteOccasion(language, occasion);
  return sendSuccess(res, { message: 'Occasion removed' });
};

/**
 * Admin: Create one or more Subha Sahit dates
 * POST /api/v1/admin/subha-sahit
 */
export const createDates = async (req: Request, res: Response, next: NextFunction) => {
  const { dates: items, language } = req.body as {
    dates: Array<{
      date: string;
      occasion: string;
      description?: string;
    }>;
    language?: string;
  };

  const created = await subhaSahitService.createDates(items, language);
  return sendSuccess(res, { dates: created });
};

/**
 * Admin: List Subha Sahit dates
 * GET /api/v1/admin/subha-sahit
 */
export const listDates = async (req: Request, res: Response, next: NextFunction) => {
  const { occasion, dateFrom, dateTo, language, page, limit } = req.query as {
    occasion?: string;
    dateFrom?: string;
    dateTo?: string;
    language?: string;
    page?: number;
    limit?: number;
  };

  const result = await subhaSahitService.listDates({
    occasion,
    dateFrom,
    dateTo,
    language,
    page,
    limit,
  });

  return sendSuccess(res, result);
};

/**
 * Admin: Get a single Subha Sahit date
 * GET /api/v1/admin/subha-sahit/:id
 */
export const getDate = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const date = await subhaSahitService.getDateById(id);
  return sendSuccess(res, { date });
};

/**
 * Admin: Update a Subha Sahit date
 * PUT /api/v1/admin/subha-sahit/:id
 */
export const updateDate = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { date, occasion, description, isActive } = req.body as {
    date?: string;
    occasion?: string;
    description?: string | null;
    isActive?: boolean;
  };

  const updated = await subhaSahitService.updateDate(id, {
    date,
    occasion,
    description,
    isActive,
  });

  return sendSuccess(res, { date: updated });
};

/**
 * Admin: Delete a Subha Sahit date
 * DELETE /api/v1/admin/subha-sahit/:id
 */
export const deleteDate = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  await subhaSahitService.deleteDate(id);
  return sendSuccess(res, { message: 'Subha Sahit date deleted successfully' });
};
