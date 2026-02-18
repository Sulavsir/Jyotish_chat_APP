/**
 * Admin Horoscope Controller - CRUD for horoscope entries (admin only)
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils';
import { HTTP_STATUS } from '../constants';
import { horoscopeService } from '../services';
import { AppError } from '../middleware/error-handler';

/**
 * List horoscopes with filters
 * GET /api/v1/admin/horoscopes
 */
export const listHoroscopes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { category, zodiacSign, language, dateFrom, dateTo, page, limit } = req.query as any;
  const result = await horoscopeService.listHoroscopes({
    category,
    zodiacSign,
    language,
    dateFrom,
    dateTo,
    page,
    limit,
  });
  return sendSuccess(res, result);
};

/**
 * Get horoscope by id
 * GET /api/v1/admin/horoscopes/:id
 */
export const getHoroscopeById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const horoscope = await horoscopeService.getHoroscopeById(id);
  if (!horoscope) {
    throw new AppError('Horoscope not found', HTTP_STATUS.NOT_FOUND);
  }
  return sendSuccess(res, { horoscope });
};

/**
 * Create one or more horoscopes (bulk API handles single entry too)
 * POST /api/v1/admin/horoscopes/bulk
 */
export const createHoroscopes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { horoscopes: items } = req.body as { horoscopes: Array<{ zodiacSign: string; category: string; date: string; content: string; language?: string }> };
  const created = await horoscopeService.createHoroscopes(
    items.map((item) => ({
      zodiacSign: item.zodiacSign,
      category: item.category as any,
      date: new Date(item.date),
      content: item.content,
      language: item.language as any,
    }))
  );
  return sendSuccess(res, { horoscopes: created }, HTTP_STATUS.CREATED);
};

/**
 * Update horoscope
 * PATCH /api/v1/admin/horoscopes/:id
 */
export const updateHoroscope = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { zodiacSign, category, date, content, language } = req.body;
  const horoscope = await horoscopeService.updateHoroscope(id, {
    ...(zodiacSign && { zodiacSign }),
    ...(category && { category }),
    ...(date && { date: new Date(date) }),
    ...(content !== undefined && { content }),
    ...(language !== undefined && { language }),
  });
  if (!horoscope) {
    throw new AppError('Horoscope not found', HTTP_STATUS.NOT_FOUND);
  }
  return sendSuccess(res, { horoscope });
};

/**
 * Delete horoscope
 * DELETE /api/v1/admin/horoscopes/:id
 */
export const deleteHoroscope = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  await horoscopeService.deleteHoroscope(id);
  return sendSuccess(res, { message: 'Horoscope deleted successfully' });
};
