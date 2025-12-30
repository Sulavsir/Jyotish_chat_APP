/**
 * Notification Service - Handle notification business logic
 */

import { prisma, Prisma } from '@jyotish/database';
import { NOTIFICATION_CONFIG } from '../constants';
import type {
  CreateNotificationData,
  NotificationQueryOptions,
  NotificationResult,
  NotificationEntity,
  ConsultationWithRelations,
  NotificationType,
} from '../types';

export class NotificationService {
  /**
   * Get all notifications for a user
   */
  async getNotificationsByUserId(
    userId: string,
    options?: NotificationQueryOptions
  ): Promise<NotificationResult> {
    const {
      limit = NOTIFICATION_CONFIG.DEFAULT_LIMIT,
      offset = NOTIFICATION_CONFIG.DEFAULT_OFFSET,
      unreadOnly = false,
    } = options || {};

    const where = {
      userId,
      ...(unreadOnly && { isRead: false }),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
    };
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(notificationId: string): Promise<NotificationEntity | null> {
    return await prisma.notification.findUnique({
      where: { id: notificationId },
    });
  }

  /**
   * Create a new notification or update existing grouped notification
   */
  async createNotification(data: CreateNotificationData): Promise<NotificationEntity> {
    const groupKey = data.groupKey;

    // If groupKey is provided, check for existing unread notification with same groupKey
    if (groupKey) {
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: data.userId,
          groupKey,
          isRead: false,
        },
      });

      if (existingNotification) {
        // Update existing notification: increment count and update time/message
        const metadataValue =
          data.metadata !== undefined
            ? data.metadata === null
              ? Prisma.JsonNull
              : data.metadata
            : existingNotification.metadata === null
              ? Prisma.JsonNull
              : existingNotification.metadata;

        const notification = await prisma.notification.update({
          where: { id: existingNotification.id },
          data: {
            count: existingNotification.count + 1,
            message: data.message, // Update to latest message
            lastUpdated: new Date(),
            metadata: metadataValue,
          },
        });

        return notification;
      }
    }

    // Create new notification
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        metadata: data.metadata || {},
        groupKey: groupKey || null,
        count: 1,
      },
    });

    return notification;
  }

  /**
   * Create multiple notifications (bulk)
   */
  async createBulkNotifications(notifications: CreateNotificationData[]): Promise<number> {
    const result = await prisma.notification.createMany({
      data: notifications.map((n) => ({
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        metadata: n.metadata || {},
      })),
    });

    return result.count;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<NotificationEntity> {
    // Verify notification belongs to user
    const notification = await this.getNotificationById(notificationId);

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new Error('Unauthorized to modify this notification');
    }

    return await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        count: 1, // Reset count to 1 when marking as read
      },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        count: 1, // Reset count to 1 when marking as read
      },
    });

    return result.count;
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    // Verify notification belongs to user
    const notification = await this.getNotificationById(notificationId);

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new Error('Unauthorized to delete this notification');
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllNotifications(userId: string): Promise<number> {
    const result = await prisma.notification.deleteMany({
      where: { userId },
    });

    return result.count;
  }

  /**
   * Delete read notifications for a user
   */
  async deleteReadNotifications(userId: string): Promise<number> {
    const result = await prisma.notification.deleteMany({
      where: {
        userId,
        isRead: true,
      },
    });

    return result.count;
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * Clean up old notifications (for cron job)
   */
  async cleanupOldNotifications(
    daysOld: number = NOTIFICATION_CONFIG.CLEANUP_DAYS
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        isRead: true,
      },
    });

    return result.count;
  }

  /**
   * Send notification for consultation booking
   */
  async notifyConsultationBooked(
    astrologerId: string,
    consultation: ConsultationWithRelations
  ): Promise<NotificationEntity> {
    return await this.createNotification({
      userId: astrologerId,
      title: 'New Consultation Booking',
      message: `You have a new ${consultation.type.toLowerCase()} consultation booked for ${new Date(consultation.scheduledAt).toLocaleString()}`,
      type: 'CONSULTATION_BOOKING' as NotificationType,
      metadata: {
        consultationId: consultation.id,
        clientId: consultation.clientId,
      },
    });
  }

  /**
   * Send consultation reminder notification
   */
  async notifyConsultationReminder(
    userId: string,
    consultation: ConsultationWithRelations,
    minutesBefore: number
  ): Promise<NotificationEntity> {
    return await this.createNotification({
      userId,
      title: 'Consultation Reminder',
      message: `Your ${consultation.type.toLowerCase()} consultation is starting in ${minutesBefore} minutes`,
      type: 'CONSULTATION_REMINDER' as NotificationType,
      metadata: {
        consultationId: consultation.id,
      },
    });
  }

  /**
   * Send daily horoscope notification
   */
  async notifyDailyHoroscope(
    userId: string,
    zodiacSign: string,
    horoscopePreview: string
  ): Promise<NotificationEntity> {
    return await this.createNotification({
      userId,
      title: `Your Daily ${zodiacSign} Horoscope`,
      message: horoscopePreview,
      type: 'HOROSCOPE' as NotificationType,
      metadata: {
        zodiacSign,
      },
    });
  }
}

export const notificationService = new NotificationService();
