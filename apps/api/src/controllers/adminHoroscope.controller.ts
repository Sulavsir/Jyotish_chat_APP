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
  const { category, zodiacSign, dateFrom, dateTo, page, limit } = req.query as any;
  const result = await horoscopeService.listHoroscopes({
    category,
    zodiacSign,
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
 * Create horoscope
 * POST /api/v1/admin/horoscopes
 */
export const createHoroscope = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { zodiacSign, category, date, content } = req.body;
  const horoscope = await horoscopeService.createHoroscope({
    zodiacSign,
    category,
    date: new Date(date),
    content,
  });
  return sendSuccess(res, { horoscope }, HTTP_STATUS.CREATED);
};

/**
 * Update horoscope
 * PATCH /api/v1/admin/horoscopes/:id
 */
export const updateHoroscope = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { zodiacSign, category, date, content } = req.body;
  const horoscope = await horoscopeService.updateHoroscope(id, {
    ...(zodiacSign && { zodiacSign }),
    ...(category && { category }),
    ...(date && { date: new Date(date) }),
    ...(content !== undefined && { content }),
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
