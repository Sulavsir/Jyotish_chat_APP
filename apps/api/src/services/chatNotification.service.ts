/**
 * Chat Notification Service
 * Handles notification creation and socket emission for chat lifecycle events
 */

import { NotificationType } from '@jyotish/shared';
import { NotificationService } from './notification.service';
import { getSocketInstance } from '../utils/socket-instance';
import type { NotificationEntity } from '../types';

/** Chat with minimal fields needed for chat-ended notification */
export interface ChatEndedPayload {
  id: string;
  participant1Id: string;
  participant2Id: string;
  endedBy: string | null;
  endedAt: Date | null;
  status: string;
  isLocked: boolean;
}

/** Chat with minimal fields needed for chat-abandoned notification */
export interface ChatAbandonedPayload {
  id: string;
  participant1Id: string;
  participant2Id: string;
}

/**
 * Create and emit CHAT_ENDED notification to the participant who did not end the chat
 */
export async function createChatEndedNotification(
  updatedChat: ChatEndedPayload
): Promise<NotificationEntity | null> {
  const notificationService = new NotificationService();

  const otherParticipantId =
    updatedChat.endedBy === updatedChat.participant1Id
      ? updatedChat.participant2Id
      : updatedChat.participant1Id;
  const endedByName = updatedChat.endedBy === updatedChat.participant1Id ? 'Client' : 'Jyotish';

  // participant1 is always client, participant2 is always astrologer
  const isClient = otherParticipantId === updatedChat.participant1Id;

  const notification = await notificationService.createNotification({
    ...(isClient ? { userId: otherParticipantId } : { astrologerId: otherParticipantId }),
    title: 'Chat Ended',
    message: `${endedByName} has ended the chat session.`,
    type: NotificationType.CHAT_ENDED,
    metadata: { chatId: updatedChat.id, endedBy: updatedChat.endedBy },
    groupKey: `chat-ended:${updatedChat.id}`,
  });

  try {
    const io = getSocketInstance();
    if (io) {
      io.to(`user:${otherParticipantId}`).emit('notification:new', notification);
    }
  } catch (socketError) {
    console.error('Error emitting chat-ended notification:', socketError);
  }

  return notification;
}

/**
 * Create and emit CHAT_ABANDONED notifications to both client and astrologer
 */
export async function createChatAbandonedNotifications(
  chat: ChatAbandonedPayload,
  reason?: string
): Promise<{ clientNotification: NotificationEntity; astrologerNotification: NotificationEntity }> {
  const notificationService = new NotificationService();

  const abandonMsg = reason || 'This conversation has been ended by administration';

  const [clientNotification, astrologerNotification] = await Promise.all([
    notificationService.createNotification({
      userId: chat.participant1Id,
      title: 'Conversation Ended by Administration',
      message: abandonMsg,
      type: NotificationType.CHAT_ABANDONED,
      metadata: { chatId: chat.id, abandonReason: reason },
      groupKey: `chat-abandoned:${chat.id}`,
    }),
    notificationService.createNotification({
      astrologerId: chat.participant2Id,
      title: 'Conversation Ended by Administration',
      message: abandonMsg,
      type: NotificationType.CHAT_ABANDONED,
      metadata: { chatId: chat.id, abandonReason: reason },
      groupKey: `chat-abandoned:${chat.id}:astrologer`,
    }),
  ]);

  try {
    const io = getSocketInstance();
    if (io) {
      io.to(`user:${chat.participant1Id}`).emit('notification:new', clientNotification);
      io.to(`user:${chat.participant2Id}`).emit('notification:new', astrologerNotification);
    }
  } catch (socketError) {
    console.error('Error emitting chat-abandoned notifications:', socketError);
  }

  return { clientNotification, astrologerNotification };
}
