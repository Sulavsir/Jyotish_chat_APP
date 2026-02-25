/**
 * Fonepay routes – Third-Party Dynamic QR (generate, check-status, tax-refund)
 */

import { Router } from 'express';
import { asyncHandler } from '../utils';
import { validateBody } from '../middleware/validate';
import {
  generateQrSchema,
  checkStatusSchema,
  taxRefundSchema,
} from '../validators/fonepay.validators';
import * as fonepayController from '../controllers/fonepay.controller';

const router = Router();

router.post(
  '/generate-qr',
  validateBody(generateQrSchema),
  asyncHandler(fonepayController.generateQr)
);

router.post(
  '/check-status',
  validateBody(checkStatusSchema),
  asyncHandler(fonepayController.checkStatus)
);

router.post(
  '/tax-refund',
  validateBody(taxRefundSchema),
  asyncHandler(fonepayController.taxRefund)
);

export default router;
