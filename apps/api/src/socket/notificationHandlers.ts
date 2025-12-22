import { Server, Socket } from 'socket.io';
import { prisma } from '@jyotish/database';

export function notificationHandlers(io: Server, socket: Socket) {
  const user = socket.data.user;

  // Mark notification as read
  socket.on('notification:mark-read', async (data: { notificationId: string }) => {
    try {
      await prisma.notification.update({
        where: {
          id: data.notificationId,
          userId: user.id,
        },
        data: {
          isRead: true,
        },
      });

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
          userId: user.id,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      socket.emit('notification:all-marked-read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  });
}

