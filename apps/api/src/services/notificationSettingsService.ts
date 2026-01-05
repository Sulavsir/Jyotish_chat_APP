/**
 * Notification Settings Service
 * Handles notification settings business logic
 */

import { prisma } from '@jyotish/database';
import { UserRole } from '@jyotish/shared';

/**
 * Get user's notification settings
 */
export const getNotificationSettings = async (userId: string, userRole?: UserRole) => {
  // Check if user exists in User table (only CLIENT users)
  const userExists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  // If user is not a CLIENT or doesn't exist, return default settings without saving
  if (!userExists || userExists.role !== UserRole.CLIENT) {
    return {
      id: 'temp',
      userId,
      notificationsEnabled: true,
      chatNotifications: true,
      consultationNotifications: true,
      paymentNotifications: true,
      marketingNotifications: false,
      emailNotifications: true,
      pushNotifications: true,
      soundEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

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
  // Check if user exists in User table (only CLIENT users)
  const userExists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  // If user is not a CLIENT or doesn't exist, return merged default settings
  if (!userExists || userExists.role !== UserRole.CLIENT) {
    return {
      id: 'temp',
      userId,
      notificationsEnabled: data.notificationsEnabled ?? true,
      chatNotifications: data.chatNotifications ?? true,
      consultationNotifications: data.consultationNotifications ?? true,
      paymentNotifications: data.paymentNotifications ?? true,
      marketingNotifications: data.marketingNotifications ?? false,
      emailNotifications: data.emailNotifications ?? true,
      pushNotifications: data.pushNotifications ?? true,
      soundEnabled: data.soundEnabled ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

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
