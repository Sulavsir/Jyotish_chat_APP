/**
 * Admin Platform Coin Rates Controller
 * GET /api/v1/admin/coin-rates
 * PUT /api/v1/admin/coin-rates
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as platformCoinRateService from '../services/platformCoinRate.service';
import { sendSuccess } from '../utils';
import type { UpdatePlatformCoinRatesInput } from '../services/platformCoinRate.service';

export async function getCoinRates(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const rates = await platformCoinRateService.getAllRates();
    return sendSuccess(res, { rates });
  } catch (error) {
    next(error);
  }
}

export async function updateCoinRates(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const body = req.body as UpdatePlatformCoinRatesInput;
    const rates = await platformCoinRateService.updateRates(body);
    return sendSuccess(res, {
      rates,
      message: 'Coin rates updated successfully.',
    });
  } catch (error) {
    next(error);
  }
}
