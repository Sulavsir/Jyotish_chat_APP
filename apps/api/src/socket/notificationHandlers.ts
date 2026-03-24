import { Server, Socket } from 'socket.io';
import { prisma } from '@jyotish/database';
import { notificationService } from '../services/notification.service';

export function notificationHandlers(io: Server, socket: Socket) {
  const user = socket.data.user;

  /**
   * Fetch notifications via socket (instead of HTTP polling).
   * Additive event; Flutter remains on HTTP, web can use this to reduce server load.
   *
   * Client usage:
   * socket.emit('notifications:get', { limit, offset, unreadOnly }, (res) => { ... })
   */
  socket.on(
    'notifications:get',
    async (
      params: { limit?: number; offset?: number; unreadOnly?: boolean } = {},
      ack?: (res: {
        notifications: unknown[];
        total: number;
        unreadCount: number;
        limit: number;
        offset: number;
      }) => void
    ) => {
      try {
        const userId = user?.id;
        if (!userId) {
          ack?.({ notifications: [], total: 0, unreadCount: 0, limit: 0, offset: 0 });
          return;
        }

        const limit = typeof params.limit === 'number' ? params.limit : 5;
        const offset = typeof params.offset === 'number' ? params.offset : 0;
        const unreadOnly = !!params.unreadOnly;

        const result = await notificationService.getNotificationsByUserId(userId, {
          limit,
          offset,
          unreadOnly,
        });

        ack?.({
          notifications: result.notifications,
          total: result.total,
          unreadCount: result.unreadCount,
          limit,
          offset,
        });
      } catch (error) {
        console.error('[notifications:get] failed', error);
        ack?.({ notifications: [], total: 0, unreadCount: 0, limit: 0, offset: 0 });
      }
    }
  );

  // Mark notification as read (supports both clients and astrologers)
  socket.on('notification:mark-read', async (data: { notificationId: string }) => {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: data.notificationId },
        select: { userId: true, astrologerId: true },
      });
      if (!notification) return;
      const belongsToUser =
        notification.userId === user.id || notification.astrologerId === user.id;
      if (!belongsToUser) return;

      await prisma.notification.update({
        where: { id: data.notificationId },
        data: { isRead: true },
      });

      notificationService.invalidateUserCache(user.id);
      socket.emit('notification:marked-read', { notificationId: data.notificationId });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  });

  // Mark all notifications as read
  socket.on('notification:mark-all-read', async () => {
    try {
      await prisma.notification.updateMany({
        where: {
          OR: [{ userId: user.id }, { astrologerId: user.id }],
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      notificationService.invalidateUserCache(user.id);
      socket.emit('notification:all-marked-read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  });
}
