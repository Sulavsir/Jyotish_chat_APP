/**
 * Admin controller for broadcast question pricing (NRs per question count)
 */

import type { Response } from 'express';
import * as broadcastQuestionPricingService from '../services/broadcastQuestionPricing.service';
import { AuthRequest } from '@/types';
import { sendSuccess, sendError } from '../utils';
import { HTTP_STATUS } from '../constants';

export async function getPricing(req: AuthRequest, res: Response) {
  try {
    const tiers = await broadcastQuestionPricingService.getPricingTiers();
    return sendSuccess(res, { tiers });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error getting broadcast question pricing:', error);
    return sendError(
      res,
      err?.message ?? 'Failed to retrieve pricing',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

export async function updatePricing(req: AuthRequest, res: Response) {
  try {
    const { tiers } = req.body as { tiers: { questionCount: number; amountNr: number }[] };
    const updated = await broadcastQuestionPricingService.replaceTiers(tiers);
    return sendSuccess(res, { tiers: updated, message: 'Broadcast question pricing updated.' });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error updating broadcast question pricing:', error);
    return sendError(
      res,
      err?.message ?? 'Failed to update pricing',
      HTTP_STATUS.BAD_REQUEST
    );
  }
}
