/**
 * Notification Settings Service
 * Frontend service for managing user notification preferences
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';

export interface NotificationSettings {
  id: string;
  userId: string;
  notificationsEnabled: boolean;
  chatNotifications: boolean;
  consultationNotifications: boolean;
  paymentNotifications: boolean;
  marketingNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateNotificationSettingsDto {
  notificationsEnabled?: boolean;
  chatNotifications?: boolean;
  consultationNotifications?: boolean;
  paymentNotifications?: boolean;
  marketingNotifications?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  soundEnabled?: boolean;
}

class NotificationSettingsService {
  /**
   * Get current user's notification settings
   */
  async getSettings(): Promise<NotificationSettings> {
    return await apiClient.get<NotificationSettings>(API_ENDPOINTS.NOTIFICATION_SETTINGS.GET);
  }

  /**
   * Update notification settings
   */
  async updateSettings(settings: UpdateNotificationSettingsDto): Promise<NotificationSettings> {
    return await apiClient.put<NotificationSettings>(API_ENDPOINTS.NOTIFICATION_SETTINGS.UPDATE, settings);
  }

  /**
   * Toggle all notifications on or off
   */
  async toggleAllNotifications(enable: boolean): Promise<NotificationSettings> {
    return await apiClient.post<NotificationSettings>(API_ENDPOINTS.NOTIFICATION_SETTINGS.TOGGLE, {
      enable,
    });
  }

  /**
   * Enable notifications
   */
  async enableNotifications(): Promise<NotificationSettings> {
    return this.toggleAllNotifications(true);
  }

  /**
   * Disable notifications
   */
  async disableNotifications(): Promise<NotificationSettings> {
    return this.toggleAllNotifications(false);
  }
}

export const notificationSettingsService = new NotificationSettingsService();

