/**
 * Notification Settings Service
 * Frontend service for managing user notification preferences
 */

import { apiClient } from '@/lib/api-client';

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
    return await apiClient.get<NotificationSettings>('/api/v1/notification-settings');
  }

  /**
   * Update notification settings
   */
  async updateSettings(settings: UpdateNotificationSettingsDto): Promise<NotificationSettings> {
    return await apiClient.put<NotificationSettings>('/api/v1/notification-settings', settings);
  }

  /**
   * Toggle all notifications on or off
   */
  async toggleAllNotifications(enable: boolean): Promise<NotificationSettings> {
    return await apiClient.post<NotificationSettings>('/api/v1/notification-settings/toggle', {
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

