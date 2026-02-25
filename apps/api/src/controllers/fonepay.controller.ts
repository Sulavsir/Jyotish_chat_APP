/**
 * Fonepay controller – generate QR, check status, tax refund
 */

import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../utils';
import { HTTP_STATUS } from '../constants';
import * as fonepayService from '../services/fonepay.service';
import type { GenerateQrBody, CheckStatusBody, TaxRefundBody } from '../validators/fonepay.validators';

/**
 * POST /api/v1/fonepay/generate-qr
 */
export async function generateQr(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as GenerateQrBody;
    const result = await fonepayService.generateQr(body);
    if (!result.success) {
      return sendError(
        res,
        result.error,
        (result.code && result.code >= 400 && result.code < 600 ? result.code : HTTP_STATUS.BAD_REQUEST) as number
      );
    }
    return sendSuccess(res, result, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/fonepay/check-status
 */
export async function checkStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as CheckStatusBody;
    const result = await fonepayService.checkStatus(body);
    if (!result.success) {
      return sendError(
        res,
        result.error,
        (result.code && result.code >= 400 && result.code < 600 ? result.code : HTTP_STATUS.BAD_REQUEST) as number
      );
    }
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/fonepay/tax-refund
 */
export async function taxRefund(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as TaxRefundBody;
    const result = await fonepayService.postTaxRefund(body);
    if (!result.success) {
      return sendError(
        res,
        result.error,
        (result.code && result.code >= 400 && result.code < 600 ? result.code : HTTP_STATUS.BAD_REQUEST) as number
      );
    }
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}
