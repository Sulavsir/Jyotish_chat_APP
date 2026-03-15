/**
 * Nepali Date Controller - Public convert English ↔ Bikram Sambat (Nepali)
 */

import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils';
import * as nepaliDateService from '../services/nepali-date.service';
import type { ConvertNepaliDatesResponse } from '../types/nepali-date.types';
import type {
  ConvertNepaliDatesBody,
  AdMonthQuery,
  BsMonthQuery,
  GetNepaliDateQuery,
  GetEnglishDateQuery,
} from '../validators/nepali-date.validators';

/**
 * Public: Get Nepali date for a single English date
 * GET /api/v1/public/nepali-date?date=YYYY-MM-DD
 */
export const getByDate = async (req: Request, res: Response, next: NextFunction) => {
  const { date } = req.query as GetNepaliDateQuery;
  const result = await nepaliDateService.findByEnglishDate(date);
  return sendSuccess(res, result ?? null);
};

/**
 * Public: Get English date for a single Nepali date (BS)
 * GET /api/v1/public/nepali-date/english?nepaliDate=YYYY-MM-DD
 */
export const getEnglishByNepaliDate = async (req: Request, res: Response, next: NextFunction) => {
  const { nepaliDate } = req.query as GetEnglishDateQuery;
  const result = await nepaliDateService.findByNepaliDate(nepaliDate);
  return sendSuccess(res, result ?? null);
};

/**
 * Public: Convert English → Nepali and/or Nepali → English in one request
 * POST /api/v1/public/nepali-date/convert
 * Body: { dates?: string[], nepaliDates?: string[] }
 * - dates: English YYYY-MM-DD → returns map (englishDate -> { nepaliDate, days })
 * - nepaliDates: Nepali BS YYYY-MM-DD → returns mapNepaliToEnglish (nepaliDate -> { englishDate, days })
 */
export const convertBulk = async (req: Request, res: Response, next: NextFunction) => {
  const { dates, nepaliDates } = req.body as ConvertNepaliDatesBody;
  const [map, mapNepaliToEnglish] = await Promise.all([
    dates?.length ? nepaliDateService.findByEnglishDates(dates) : Promise.resolve({}),
    nepaliDates?.length ? nepaliDateService.findByNepaliDates(nepaliDates) : Promise.resolve({}),
  ]);
  const payload: ConvertNepaliDatesResponse = {};
  if (Object.keys(map).length > 0) payload.map = map;
  if (Object.keys(mapNepaliToEnglish).length > 0) payload.mapNepaliToEnglish = mapNepaliToEnglish;
  return sendSuccess(res, payload);
};

/**
 * Public: Get all days for an AD (English) month
 * GET /api/v1/public/nepali-date/ad-month?year=2026&month=3
 */
export const getAdMonth = async (req: Request, res: Response, next: NextFunction) => {
  const { year, month } = req.query as unknown as AdMonthQuery;
  const result = nepaliDateService.getAdMonth(year, month);
  return sendSuccess(res, result);
};

/**
 * Public: Get all days for a BS (Nepali) month
 * GET /api/v1/public/nepali-date/bs-month?year=2080&month=11
 */
export const getBsMonth = async (req: Request, res: Response, next: NextFunction) => {
  const { year, month } = req.query as unknown as BsMonthQuery;
  const result = await nepaliDateService.getBsMonth(year, month);
  return sendSuccess(res, result);
};
