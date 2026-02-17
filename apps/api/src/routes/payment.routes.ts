/**
 * Payment routes - GetPay create order and verify
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils';
import { validateBody } from '../middleware/validate';
import { createOrderSchema, verifyPaymentSchema } from '../validators/payment.validators';
import * as paymentController from '../controllers/payment.controller';

const router = Router();

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

export default router;
