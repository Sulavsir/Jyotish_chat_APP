/**
 * Payment method constants and types for checkout flow
 */

export const PAYMENT_METHOD = {
  GETPAY: 'getpay',
  FONEPAY_CARD: 'fonepay_card',
  FONEPAY_QR: 'fonepay_qr',
} as const;

export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];
