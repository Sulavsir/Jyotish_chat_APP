/**
 * Payment controller - Create order (GetPay) and verify payment
 */

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils';
import { HTTP_STATUS } from '../constants';
import * as paymentService from '../services/payment.service';
import type {
  CreateOrderBody,
  VerifyPaymentBody,
  CreateFonepayQrOrderBody,
  VerifyFonepayQrBody,
  CreateFonepayCardOrderBody,
} from '../validators/payment.validators';
import type { FonepayCardCallbackQuery } from '../services/payment.service';

const FRONTEND_ORIGIN = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');

/** GetPay may append token with ? so query can be orderId=xxx?token=yyy - normalize. */
function getOrderIdAndToken(query: Request['query']): { orderId: string; token: string } {
  let orderId = (query.orderId ?? query.orderid) as string | undefined;
  let token = (query.token ?? query.requestId ?? query.id) as string | undefined;
  if (orderId && orderId.includes('?') && !token) {
    const [id, rest] = orderId.split('?');
    orderId = id?.trim() ?? orderId;
    const restParams = new URLSearchParams(rest ?? '');
    token =
      restParams.get('token') ?? restParams.get('requestId') ?? restParams.get('id') ?? undefined;
  }
  return { orderId: orderId?.trim() ?? '', token: token?.trim() ?? '' };
}

/**
 * GET /api/v1/payments/success-redirect
 */
export async function successRedirect(req: Request, res: Response, next: NextFunction) {
  try {
    const { orderId, token } = getOrderIdAndToken(req.query);
    const params = new URLSearchParams();
    if (orderId) params.set('orderId', orderId);
    if (token) params.set('token', token);
    const qs = params.toString();
    const frontendUrl = qs
      ? `${FRONTEND_ORIGIN}/payment-success?${qs}`
      : `${FRONTEND_ORIGIN}/payment-success`;

    const useLanding = String(req.query.landing ?? '').toLowerCase() === '1';
    if (useLanding) {
      const jsUrl = JSON.stringify(frontendUrl);
      const htmlEscapedUrl = frontendUrl
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res
        .status(200)
        .send(
          `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Redirecting...</title></head><body>` +
            `<p>Redirecting to payment success...</p>` +
            `<script>window.location.href=${jsUrl};</script>` +
            `<p><a href="${htmlEscapedUrl}">Click here if not redirecteAd</a></p></body></html>`
        );
      return;
    }
    res.redirect(302, frontendUrl);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/payments/fail-redirect
 * GetPay redirects here after payment fail. We 302 to frontend payment-fail.
 */
export async function failRedirect(req: Request, res: Response, next: NextFunction) {
  try {
    const orderId = (req.query.orderId ?? req.query.orderid) as string | undefined;
    const message = (req.query.message as string) ?? '';
    const params = new URLSearchParams();
    if (orderId) params.set('orderId', orderId);
    if (message) params.set('message', message);
    res.redirect(302, `${FRONTEND_ORIGIN}/payment-fail?${params.toString()}`);
  } catch (error) {
    next(error);
  }
}

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
      process.env.FRONTEND_URL!;

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

    const body = req.body as VerifyPaymentBody;
    const orderId = body.orderId?.trim() ?? '';
    const transactionId = (body.token?.trim() || body.requestId?.trim() || '').trim();
    if (!transactionId) {
      return sendError(
        res,
        'Token or requestId is required for verification',
        HTTP_STATUS.BAD_REQUEST
      );
    }
    if (!orderId) {
      return sendError(res, 'Order ID is required for verification', HTTP_STATUS.BAD_REQUEST);
    }
    console.log('[Payments] verify called', { orderId, userId, hasToken: !!transactionId });
    const result = await paymentService.verifyPayment(userId, orderId, transactionId);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/payments/create-fonepay-qr-order
 * Create Fonepay QR order (Payment PENDING + generate QR). Returns prn, qrMessage, websocketUrl.
 */
export async function createFonepayQrOrder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 'Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }
    const body = req.body as CreateFonepayQrOrderBody;
    const result = await paymentService.createFonepayQrOrder(userId, body);
    return sendSuccess(res, result, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/payments/verify-fonepay-qr
 * Verify Fonepay QR payment by prn and add coins.
 */
export async function verifyFonepayQr(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 'Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }
    const body = req.body as VerifyFonepayQrBody;
    const result = await paymentService.verifyFonepayQrPayment(userId, body.prn);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/payments/create-fonepay-card-order
 * Create Fonepay Web (card) order and return redirectUrl to Fonepay.
 */
export async function createFonepayCardOrder(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 'Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }
    const body = req.body as CreateFonepayCardOrderBody;
    const result = await paymentService.createFonepayCardOrder(userId, body);
    return sendSuccess(res, result, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
}

/**
 * GET/POST /api/v1/payments/fonepay-card-callback
 * Fonepay redirects here after card payment. Verify DV and redirect to frontend success/fail.
 * IMPORTANT: This endpoint MUST always redirect, never return JSON errors.
 * Supports both GET (query params) and POST (body params) for different gateway behaviors.
 */
export async function fonepayCardCallback(req: Request, res: Response, _next: NextFunction) {
  const frontendOrigin = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const failUrl = `${frontendOrigin}/payment-fail`;
  
  try {
    // Support both GET query params and POST body params
    const params = req.method === 'POST' 
      ? { ...req.query, ...req.body } 
      : req.query;
    const query = params as unknown as FonepayCardCallbackQuery;
    
    console.log('[fonepayCardCallback] Received callback:', {
      method: req.method,
      PRN: query.PRN,
      PS: query.PS,
      RC: query.RC,
      fullQuery: query,
    });
    
    // Handle empty/missing callback (user might have navigated directly)
    if (!query || !query.PRN) {
      console.log('[fonepayCardCallback] Missing PRN, redirecting to fail page');
      return res.redirect(302, `${failUrl}?message=${encodeURIComponent('Payment callback incomplete - please try again')}`);
    }
    
    const result = await paymentService.handleFonepayCardCallback(query);
    console.log('[fonepayCardCallback] Redirecting to:', result.redirectTo);
    return res.redirect(302, result.redirectTo);
  } catch (error) {
    // Always redirect on error - never return JSON for this callback
    console.error('[fonepayCardCallback] Error processing callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';
    return res.redirect(302, `${failUrl}?message=${encodeURIComponent(errorMessage)}`);
  }
}
