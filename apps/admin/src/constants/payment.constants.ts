/**
 * Payment method display labels for admin UI
 * Maps backend paymentMethod values to user-friendly labels
 */

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  GETPAY: 'GetPay',
  FONEPAY_CARD: 'Fonepay Card',
  FONEPAY_QR: 'Fonepay QR',
  getpay: 'GetPay',
  fonepay_card: 'Fonepay Card',
  fonepay_qr: 'Fonepay QR',
};

export function getPaymentMethodLabel(paymentMethod?: string | null): string {
  if (!paymentMethod) return '—';
  return PAYMENT_METHOD_LABELS[paymentMethod] ?? paymentMethod.replace(/_/g, ' ');
}
