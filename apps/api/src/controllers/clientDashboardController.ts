/**
 * Client Dashboard Controller
 * GET /api/v1/users/dashboard/stats - Aggregated dashboard data for clients
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import { AppError } from '../middleware/error-handler';
import { getClientDashboardStats } from '../services/clientDashboard.service';
import { UserRole } from '@jyotish/shared';
import type { QuestionnaireLanguage } from '@jyotish/shared';

/**
 * Get client dashboard stats (balance, rates, tip, horoscope, rotating copy, pending broadcast)
 * GET /api/v1/users/dashboard/stats?language=NEPALI|HINDI|ENGLISH
 */
export async function getDashboardStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (req.user?.role !== UserRole.CLIENT) {
      throw new AppError('Forbidden', HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
    }

    const userId = req.user.id;
    const language = req.query.language as QuestionnaireLanguage | undefined;

    const stats = await getClientDashboardStats(userId, language);

    return sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
}
