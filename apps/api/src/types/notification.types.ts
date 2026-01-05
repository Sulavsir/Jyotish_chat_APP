/**
 * Notification Type Definitions
 */

import type { NotificationType } from '@jyotish/shared';
import type { NotificationEntity } from './database.types';

export interface CreateNotificationData {
  userId?: string; // For clients
  astrologerId?: string; // For astrologers
  title: string;
  message: string;
  type: NotificationType;
  metadata?: unknown;
  groupKey?: string;
}

export interface NotificationQueryOptions {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}

export interface NotificationResult {
  notifications: NotificationEntity[];
  total: number;
  unreadCount: number;
}
