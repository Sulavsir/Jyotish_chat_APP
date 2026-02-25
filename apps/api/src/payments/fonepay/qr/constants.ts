/** Fonepay Dynamic QR API paths (do not use for Web redirect) */
export const FONEPAY_QR_PATH_GENERATE =
  '/merchant/merchantDetailsForThirdParty/thirdPartyDynamicQrDownload';
export const FONEPAY_QR_PATH_CHECK_STATUS =
  '/merchant/merchantDetailsForThirdParty/thirdPartyDynamicQrGetStatus';
export const FONEPAY_QR_PATH_TAX_REFUND =
  '/merchant/merchantDetailsForThirdParty/thirdPartyPostTaxRefund';

export const FONEPAY_QR_STATUS_CREATED = 'CREATED';
export const FONEPAY_QR_STATUS_VERIFIED = 'VERIFIED';
export const FONEPAY_QR_STATUS_SUCCESS = 'SUCCESS';
export const FONEPAY_QR_STATUS_FAILED = 'FAILED';

export const FONEPAY_TRANSACTION_TYPE_QR = 'QR';
