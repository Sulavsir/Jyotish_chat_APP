/**
 * Service Return Types
 */

import type {
  UserResponse,
  ConsultationEntity,
  NotificationEntity,
  HoroscopeSubscriptionEntity,
} from './database.types';
import type { UserSummary, AstrologerSummary, PaymentSummary } from './common.types';

export interface ConsultationWithRelations extends ConsultationEntity {
  client: UserSummary;
  astrologer: AstrologerSummary;
  payment?: PaymentSummary | null;
}

export interface NotificationWithMeta {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  metadata?: unknown;
  createdAt: Date;
}

export interface HoroscopeResponse {
  zodiacSign: string;
  date: Date;
  prediction: string;
  category: string;
  love?: number;
  career?: number;
  health?: number;
  finance?: number;
}
