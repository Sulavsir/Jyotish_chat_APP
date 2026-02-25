/**
 * Payment routes - GetPay create order and verify
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils';
import { validateBody } from '../middleware/validate';
import {
  createOrderSchema,
  verifyPaymentSchema,
  createFonepayQrOrderSchema,
  verifyFonepayQrSchema,
  createFonepayCardOrderSchema,
} from '../validators/payment.validators';
import * as paymentController from '../controllers/payment.controller';

const router = Router();

// Public: GetPay redirects here after OTP (no auth). We then 302 to frontend.
router.get('/success-redirect', asyncHandler(paymentController.successRedirect));
router.get('/fail-redirect', asyncHandler(paymentController.failRedirect));
// Public: Fonepay redirects here after card payment. We verify and 302 to frontend.
router.get('/fonepay-card-callback', asyncHandler(paymentController.fonepayCardCallback));

router.use(authenticate);

router.post(
  '/create-order',
  validateBody(createOrderSchema),
  asyncHandler(paymentController.createOrder)
);

router.post(
  '/verify',
  validateBody(verifyPaymentSchema),
  asyncHandler(paymentController.verifyPayment)
);

router.post(
  '/create-fonepay-qr-order',
  validateBody(createFonepayQrOrderSchema),
  asyncHandler(paymentController.createFonepayQrOrder)
);

router.post(
  '/verify-fonepay-qr',
  validateBody(verifyFonepayQrSchema),
  asyncHandler(paymentController.verifyFonepayQr)
);

router.post(
  '/create-fonepay-card-order',
  validateBody(createFonepayCardOrderSchema),
  asyncHandler(paymentController.createFonepayCardOrder)
);

export default router;
