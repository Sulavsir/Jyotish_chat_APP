/**
 * Human-readable labels for payment gateway identifiers stored on Payment.paymentMethod.
 * Used by API notifications and web UI — single source of truth.
 */
export const PAYMENT_METHOD_DISPLAY: Record<string, string> = {
  GETPAY: 'GetPay',
  FONEPAY_QR: 'Fonepay QR',
  FONEPAY_CARD: 'Fonepay',
};

export function formatPaymentMethodDisplay(method: string): string {
  const key = method.trim();
  if (PAYMENT_METHOD_DISPLAY[key]) return PAYMENT_METHOD_DISPLAY[key];
  return key.replace(/_/g, ' ');
}
