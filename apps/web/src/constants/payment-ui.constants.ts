/**
 * User-facing copy for payment result screens (shared across fail page and success-page error state).
 */

export const PAYMENT_UI = {
  bankDebitTitle: 'If your bank or wallet shows a debit',
  bankDebitBody:
    'Sometimes the payment gateway declines the transaction even when your bank has placed a hold or completed a debit. If your balance here did not increase but you see a charge on your bank or mobile wallet statement, contact your bank or payment provider with your order reference. They can confirm whether the payment was captured or will be reversed automatically.',
  supportHint:
    'You can also contact our support team with your order ID and any SMS or email receipt from your bank.',
} as const;
