/**
 * Fonepay Dynamic QR – thin wrapper around payments/fonepay/qr.
 * Use payments/fonepay/qr directly in new code. ENV: FONEPAY_QR_* only.
 */

import * as qr from '../payments/fonepay/qr';

export const generateQr = qr.generateQr;
export const checkStatus = qr.checkStatus;
export const postTaxRefund = qr.postTaxRefund;
export const updateTransactionStatus = qr.updateTransactionStatus;
