/**
 * Service Return Types
 */

import type {
  UserResponse,
  ConsultationEntity,
  NotificationEntity,
  HoroscopeSubscriptionEntity,
} from './database.types';

export interface ConsultationWithRelations extends ConsultationEntity {
  client: {
    id: string;
    name: string | null;
    phone: string;
    email: string | null;
    profilePhoto: string | null;
  };
  astrologer: {
    id: string;
    name: string | null;
    phone: string;
    email: string | null;
    profilePhoto: string | null;
  };
  payment?: {
    id: string;
    amount: number;
    status: string;
    transactionId: string | null;
  } | null;
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
