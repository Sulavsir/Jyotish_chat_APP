/**
 * Nepali Date Controller - Public convert English date to Bikram Sambat
 */

import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils';
import * as nepaliDateService from '../services/nepali-date.service';

/**
 * Public: Get Nepali date for a single English date
 * GET /api/v1/public/nepali-date?date=YYYY-MM-DD
 */
export const getByDate = async (req: Request, res: Response, next: NextFunction) => {
  const { date } = req.query as { date: string };
  const result = await nepaliDateService.findByEnglishDate(date);
  return sendSuccess(res, result ?? null);
};

/**
 * Public: Convert multiple English dates to Nepali in one request
 * POST /api/v1/public/nepali-date/convert
 * Body: { dates: string[] } (YYYY-MM-DD each)
 */
export const convertBulk = async (req: Request, res: Response, next: NextFunction) => {
  const { dates } = req.body as { dates: string[] };
  const map = await nepaliDateService.findByEnglishDates(dates);
  return sendSuccess(res, { map });
};
