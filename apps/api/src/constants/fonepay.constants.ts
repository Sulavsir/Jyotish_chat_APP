/**
 * Fonepay QR config helper (legacy). Prefer payments/fonepay/qr and getFonepayQrEnv().
 * Do not use for Web redirect – use FONEPAY_WEB_* and payments/fonepay/web.
 */

import { getFonepayQrEnv } from '../config/fonepay-qr.env';

export const FONEPAY_PATH_GENERATE_QR =
  '/merchant/merchantDetailsForThirdParty/thirdPartyDynamicQrDownload';
export const FONEPAY_PATH_CHECK_STATUS =
  '/merchant/merchantDetailsForThirdParty/thirdPartyDynamicQrGetStatus';
export const FONEPAY_PATH_TAX_REFUND =
  '/merchant/merchantDetailsForThirdParty/thirdPartyPostTaxRefund';

export interface FonepayConfig {
  baseUrl: string;
  wsBase: string;
  username: string;
  password: string;
  merchantCode: string;
  isConfigured: boolean;
}

export function getFonepayConfig(): FonepayConfig {
  const env = getFonepayQrEnv();
  if (!env) {
    return {
      baseUrl: '',
      wsBase: '',
      username: '',
      password: '',
      merchantCode: '',
      isConfigured: false,
    };
  }
  return {
    baseUrl: env.FONEPAY_QR_BASE_URL.replace(/\/$/, ''),
    wsBase: env.FONEPAY_QR_WS_BASE.replace(/\/$/, ''),
    username: env.FONEPAY_QR_USERNAME,
    password: env.FONEPAY_QR_PASSWORD,
    merchantCode: env.FONEPAY_QR_MERCHANT_CODE,
    isConfigured: true,
  };
}
