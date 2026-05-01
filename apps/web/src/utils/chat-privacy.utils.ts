import type { Chat } from '@/types/chat';
import { UserRole } from '@/types/user.types';

/**
 * Remove phone/email from the *other* party in client↔jyotish threads before storing in UI state.
 * Appointments and admin use separate APIs.
 */
export function redactPeerContactFieldsForChatViewer(chat: Chat, viewerRole: UserRole): Chat {
  if (viewerRole === UserRole.CLIENT) {
    return {
      ...chat,
      astrologerParticipant: {
        ...chat.astrologerParticipant,
        phone: undefined,
        email: undefined,
      },
    };
  }
  if (viewerRole === UserRole.ASTROLOGER) {
    return {
      ...chat,
      clientParticipant: {
        ...chat.clientParticipant,
        phone: undefined,
        email: undefined,
      },
    };
  }
  return chat;
}

export function redactPeerContactFieldsForChats(chats: Chat[], viewerRole: UserRole): Chat[] {
  return chats.map((c) => redactPeerContactFieldsForChatViewer(c, viewerRole));
}
