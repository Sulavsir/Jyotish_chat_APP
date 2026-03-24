import { ParticipantType } from '@prisma/client';
import { UserRole } from '@jyotish/shared';

/**
 * Copy for CHAT_MESSAGE notifications so direct DM (client → jyotish) is distinct
 * from broadcast ("New Chat Request") and instant chat.
 */
export function buildDmChatNotificationCopy(params: {
  senderName: string;
  senderRole: UserRole;
  receiverType: ParticipantType;
  /** Total count after this message (1 = first in group) */
  messageCountInGroup: number;
}): { title: string; message: string } {
  const { senderName, senderRole, receiverType, messageCountInGroup } = params;
  const clientMessagedAstrologer =
    senderRole === UserRole.CLIENT && receiverType === ParticipantType.ASTROLOGER;

  if (clientMessagedAstrologer) {
    return {
      title: 'Direct message',
      message:
        messageCountInGroup > 1
          ? `You have ${messageCountInGroup} new direct messages from ${senderName}.`
          : `${senderName} sent you a direct message.`,
    };
  }

  return {
    title: 'New message',
    message:
      messageCountInGroup > 1
        ? `You have ${messageCountInGroup} new messages from ${senderName}.`
        : `You have a new message from ${senderName}.`,
  };
}
