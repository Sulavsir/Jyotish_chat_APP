/**
 * Notification Service - Notification API calls
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS, PAGINATION } from '@/constants';
import type { ApiResponse, Notification } from '@/types';

export const notificationService = {
  /**
   * Get notifications
   */
  async getNotifications(
    page: number = PAGINATION.DEFAULT_PAGE,
    unreadOnly: boolean = false
  ): Promise<Notification[]> {
    return await apiClient.get<Notification[]>(API_ENDPOINTS.NOTIFICATIONS.LIST, {
      params: {
        page,
        limit: PAGINATION.NOTIFICATIONS_LIMIT,
        unreadOnly,
      },
    });
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await apiClient.patch(API_ENDPOINTS.NOTIFICATIONS.READ(notificationId));
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    await apiClient.patch(API_ENDPOINTS.NOTIFICATIONS.READ_ALL);
  },
};
