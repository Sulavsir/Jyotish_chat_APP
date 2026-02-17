/**
 * Payment controller - Create order (GetPay) and verify payment
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils';
import { HTTP_STATUS } from '../constants';
import * as paymentService from '../services/payment.service';
import type { CreateOrderBody, VerifyPaymentBody } from '../validators/payment.validators';

/**
 * POST /api/v1/payments/create-order
 * Create a PENDING payment order and return GetPay checkout params (no oprKey).
 */
export async function createOrder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 'Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    const body = req.body as CreateOrderBody;
    const baseOrigin =
      (req.headers.origin ?? req.headers.referer ?? '').replace(/\/$/, '') ||
      process.env.FRONTEND_URL ||
      'http://localhost:3000';

    const result = await paymentService.createOrder(userId, body, baseOrigin);
    return sendSuccess(res, result, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/payments/verify
 * Verify payment with GetPay and complete order (add coins / activate plan).
 */
export async function verifyPayment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 'Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    const { token, orderId } = req.body as VerifyPaymentBody;
    const result = await paymentService.verifyPayment(userId, orderId, token);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}
