import type { JyotishBookingStatus, JyotishBookingType } from '@jyotish/database';

export type JyotishBookingNotificationEvent = 'APPROVED' | 'REJECTED';

export interface JyotishBookingNotificationMetadata {
  event: JyotishBookingNotificationEvent;
  jyotishBookingId: string;
  bookingType: JyotishBookingType;
  category: string;
  bookingDate: string;
  status: JyotishBookingStatus;
}
