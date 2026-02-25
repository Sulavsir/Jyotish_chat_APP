/**
 * Tip Controller - Daily dashboard tips for clients and jyotish
 */

import type { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils';
import { tipService } from '../services/tip.service';
import type { QuestionnaireLanguage, TipAudience } from '@jyotish/shared';

/**
 * Public: Get tips for a date (default: server today). Use date=YYYY-MM-DD for client's local day.
 * GET /api/v1/tips/today?audience=CLIENT|JYOTISH|BOTH&language=NEPALI|HINDI|ENGLISH&date=YYYY-MM-DD
 */
export const getTodayTips = async (req: Request, res: Response, next: NextFunction) => {
  const { audience, language, date: dateStr } = req.query as {
    audience?: TipAudience;
    language?: QuestionnaireLanguage;
    date?: string;
  };

  const date = dateStr ? new Date(dateStr) : undefined;
  const tips = await tipService.getTipsForDate({
    date,
    audience,
    language,
  });

  return sendSuccess(res, { tips });
};

/**
 * Admin: Create one or more tips. Body: { tips: [...] }. Single or batch uses same endpoint.
 * POST /api/v1/admin/tips
 */
export const createTips = async (req: Request, res: Response, next: NextFunction) => {
  const { tips: items } = req.body as {
    tips: Array<{
      date: string;
      text: string;
      language: QuestionnaireLanguage;
      audience: TipAudience;
    }>;
  };

  const tips = await tipService.createTips(items);
  return sendSuccess(res, { tips });
};

/**
 * Admin: List tips
 * GET /api/v1/admin/tips
 */
export const listTips = async (req: Request, res: Response, next: NextFunction) => {
  const { language, audience, dateFrom, dateTo, page, limit } = req.query as {
    language?: QuestionnaireLanguage;
    audience?: TipAudience;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  };

  const result = await tipService.listTips({
    language,
    audience,
    dateFrom,
    dateTo,
    page,
    limit,
  });

  return sendSuccess(res, result);
};

/**
 * Admin: Delete tip
 * DELETE /api/v1/admin/tips/:id
 */
export const deleteTip = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  await tipService.deleteTip(id);

  return sendSuccess(res, { message: 'Tip deleted successfully' });
};

/**
 * Admin: Get tip by id
 * GET /api/v1/admin/tips/:id
 */
export const getTipById = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const tip = await tipService.getTipById(id);
  return sendSuccess(res, { tip });
};

/**
 * Admin: Update tip
 * PATCH /api/v1/admin/tips/:id
 */
export const updateTip = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { date, text, language, audience } = req.body as {
    date: string;
    text: string;
    language: QuestionnaireLanguage;
    audience: TipAudience;
  };

  const tip = await tipService.updateTip(id, { date, text, language, audience });
  return sendSuccess(res, { tip });
};

