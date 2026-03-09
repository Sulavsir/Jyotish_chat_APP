/**
 * Payment constants and GetPay configuration.
 * oprKey must never be sent to frontend.
 * No hardcoded payment/remarks strings in services – use these constants.
 */

import { PaymentStatus } from '@jyotish/database';

/** Re-export for use across payment flow (Payment model status) */
export { PaymentStatus };

/** Default currency for GetPay / Nepal payments */
export const PAYMENT_CURRENCY_DEFAULT = 'NPR';

/** Payment method identifier for GetPay gateway */
export const PAYMENT_METHOD_GETPAY = 'GETPAY';

/** Payment method: Fonepay card (redirect to enter card) */
export const PAYMENT_METHOD_FONEPAY_CARD = 'FONEPAY_CARD';

/** Payment method: Fonepay dynamic QR */
export const PAYMENT_METHOD_FONEPAY_QR = 'FONEPAY_QR';

/** Fonepay PRN prefixes – unique across QR and Web (max 25 chars total) */
export const FONEPAY_PRN_PREFIX_QR = 'TXN-QR-';
export const FONEPAY_PRN_PREFIX_WEB = 'TXN-WEB-';

/** Length of random part after prefix for PRN (QR: 18 → 25 total, Web: 17 → 25 total) */
export const FONEPAY_PRN_QR_RANDOM_LENGTH = 18;
export const FONEPAY_PRN_WEB_RANDOM_LENGTH = 17;

/** Payment remarks (Fonepay QR/frontend display) – app identifier */
export const PAYMENT_REMARKS_APP_NAME = 'Jyotish';

/** Payment remarks – coins label prefix for remarks2 */
export const PAYMENT_REMARKS_COINS_PREFIX = 'coins-';

/** Fonepay Web request fixed values (do not hardcode in services) */
export const FONEPAY_WEB_MD_PAYMENT = 'P';
export const FONEPAY_WEB_CRN_NPR = 'NPR';
export const FONEPAY_WEB_R2_NA = 'N/A';

/** Fonepay Web callback – success indicators (verify before updating DB) */
export const FONEPAY_VERIFY_PS_SUCCESS = 'true';
export const FONEPAY_VERIFY_RC_SUCCESSFUL = 'successful';

/** GetPay API response status strings (do not hardcode in verify flow) */
export const GETPAY_RESPONSE_STATUS_PENDING = 'PENDING';
export const GETPAY_RESPONSE_STATUS_SUCCESS = 'SUCCESS';
export const GETPAY_RESPONSE_STATUS_COMPLETED = 'COMPLETED';
export const GETPAY_RESPONSE_STATUS_CAPTURED = 'CAPTURED';
export const GETPAY_RESPONSE_STATUS_AUTHORIZED = 'AUTHORIZED';
export const GETPAY_RESPONSE_MESSAGE_SUCCESS = 'SUCCESS';

/** GetPay merchant-status API path (appended to baseUrl) */
export const GETPAY_MERCHANT_STATUS_PATH = '/transactions/merchant-status';

export const getPayConfig = () => {
  // Script URL: The bundle.js file to load on frontend
  // Should be: https://minio.finpos.global/getpay-cdn/webcheckout/v5/bundle.js
  const scriptUrl = process.env.GETPAY_SCRIPT_URL!;

  // Base URL: The API base URL for backend verification calls
  // Should be: https://uat-bank-getpay.nchl.com.np/ecom-web-checkout/v1/secure-merchant
  // (without /transactions/merchant-status - that's appended in getpay.api.ts)
  const baseUrl = process.env.GETPAY_BASE_URL!;

  const papInfo = process.env.GETPAY_PAP_INFO!;
  const oprKey = process.env.GETPAY_OPR_KEY!;
  const insKey = process.env.GETPAY_INS_KEY!;

  return {
    baseUrl,
    scriptUrl,
    papInfo,
    oprKey,
    insKey,
    isConfigured: Boolean(scriptUrl && baseUrl && papInfo && oprKey),
  };
};
