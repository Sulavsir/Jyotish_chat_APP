/**
 * Notification Settings Service
 * Handles notification settings business logic
 */

import { prisma } from '@jyotish/database';

/**
 * Get user's notification settings
 */
export const getNotificationSettings = async (userId: string) => {
  let settings = await prisma.notificationSettings.findUnique({
    where: { userId },
  });

  // Create default settings if they don't exist
  if (!settings) {
    settings = await prisma.notificationSettings.create({
      data: {
        userId,
        notificationsEnabled: true,
        chatNotifications: true,
        consultationNotifications: true,
        paymentNotifications: true,
        marketingNotifications: false,
        emailNotifications: true,
        pushNotifications: true,
        soundEnabled: true,
      },
    });
  }

  return settings;
};

/**
 * Update user's notification settings
 */
export const updateNotificationSettings = async (
  userId: string,
  data: {
    notificationsEnabled?: boolean;
    chatNotifications?: boolean;
    consultationNotifications?: boolean;
    paymentNotifications?: boolean;
    marketingNotifications?: boolean;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    soundEnabled?: boolean;
  }
) => {
  // Ensure settings exist first
  await getNotificationSettings(userId);

  const settings = await prisma.notificationSettings.update({
    where: { userId },
    data,
  });

  return settings;
};

/**
 * Toggle all notifications
 */
export const toggleNotifications = async (userId: string, enabled: boolean) => {
  return updateNotificationSettings(userId, {
    notificationsEnabled: enabled,
  });
};
