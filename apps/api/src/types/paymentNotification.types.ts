/**
 * Metadata persisted on PAYMENT notifications (JSON on Notification.metadata).
 */
export type PaymentNotificationMetadata = {
  paymentId: string;
  outcome: 'SUCCESS' | 'FAILED';
  amount: number;
  currency: string;
  paymentMethod: string;
  /** Coins credited (top-up); omitted when only a plan was activated */
  coinsAdded?: number;
  planActivated?: boolean;
  /** Short reason for failures (gateway or verification message) */
  reason?: string;
};
