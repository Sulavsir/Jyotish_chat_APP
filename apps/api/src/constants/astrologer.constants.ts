/**
 * Astrologer-related constants
 */

/** Duration of each bookable slot in minutes */
export const SLOT_DURATION_MINUTES = 30;

// Astrologer Account Status enum values
export const ASTROLOGER_ACCOUNT_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type AstrologerAccountStatusType =
  (typeof ASTROLOGER_ACCOUNT_STATUS)[keyof typeof ASTROLOGER_ACCOUNT_STATUS];

// Astrologer Created By values
export const ASTROLOGER_CREATED_BY = {
  SELF_REGISTERED: 'SELF_REGISTERED',
} as const;
