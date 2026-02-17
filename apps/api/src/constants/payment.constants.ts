/**
 * Payment constants and GetPay configuration.
 * oprKey must never be sent to frontend.
 */

/** Default currency for GetPay / Nepal payments */
export const PAYMENT_CURRENCY_DEFAULT = 'NPR';

/** Payment method identifier for GetPay gateway */
export const PAYMENT_METHOD_GETPAY = 'GETPAY';

export const getPayConfig = () => {
  const baseUrl = process.env.GETPAY_BASE_URL ?? '';
  const scriptUrl =
    process.env.GETPAY_SCRIPT_URL ?? (baseUrl ? `${baseUrl.replace(/\/$/, '')}/checkout.js` : '');
  const papInfo = process.env.GETPAY_PAP_INFO ?? '';
  const oprKey = process.env.GETPAY_OPR_KEY ?? '';
  const insKey = process.env.GETPAY_INS_KEY ?? '';

  return {
    baseUrl,
    scriptUrl,
    papInfo,
    oprKey,
    insKey,
    isConfigured: Boolean(baseUrl && papInfo && oprKey),
  };
};
