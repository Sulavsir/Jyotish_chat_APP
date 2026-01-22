export interface Chat {
  id: string;
  participant1Id: string;
  participant2Id: string;
  consultationId?: string;
  status: 'ACTIVE' | 'ENDED';
  isLocked: boolean;
  endedBy?: string | null;
  endedAt?: Date | null;
  lastMessageAt?: Date;
  lastMessageText?: string;
  participant1Read: boolean;
  participant2Read: boolean;
  isMonitoredByAdmin?: boolean;
  adminNotes?: string | null;
  isAbandonedByAdmin?: boolean;
  abandonedBy?: string | null;
  abandonedAt?: Date | null;
  abandonReason?: string | null;
  // Turn-based messaging fields
  waitingForReply?: boolean;
  lastClientMessageAt?: Date | null;
  lastAstrologerReplyAt?: Date | null;
  turnBasedEnabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
  clientParticipant: {
    id: string;
    name: string | null;
    email?: string | null;
    phone?: string;
    profilePhoto?: string | null;
    role: string;
  };
  astrologerParticipant: {
    id: string;
    name: string | null;
    email?: string | null;
    phone?: string;
    profilePhoto?: string | null;
    role?: string;
  };
  unreadCount?: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO';
  metadata?: unknown; // JSON metadata - use unknown for type safety
  isRead: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  sender?: {
    id: string;
    name: string;
    email?: string;
    profilePhoto?: string;
    role?: string;
    dateOfBirth?: Date | string | null;
    timeOfBirth?: string | null;
    placeOfBirth?: string | null;
  };
}

export interface GetChatHistoryParams {
  otherUserId: string;
  limit?: number;
  offset?: number;
}

export interface CreateChatParams {
  otherUserId: string;
  consultationId?: string;
}

export interface SendMessageParams {
  chatId: string;
  receiverId: string;
  content: string;
  type?: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO';
  metadata?: unknown; // JSON metadata - use unknown for type safety
}

export interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    type?: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO';
    metadata?: unknown; // JSON metadata - use unknown for type safety
    createdAt: Date;
    isRead: boolean;
    senderId?: string;
    sender?: {
      id: string;
      name: string;
      profilePhoto?: string;
      role?: string;
      dateOfBirth?: Date | string | null;
      timeOfBirth?: string | null;
      placeOfBirth?: string | null;
    };
  };
  isOwn: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  onViewProfile?: (clientId: string) => void;
}

export interface FileAttachment {
  file: File;
  preview?: string; // For image previews
  type: 'image' | 'document' | 'file';
}

export interface ChatInputProps {
  onSendMessage: (content: string, attachment?: FileAttachment) => void;
  onTyping?: (isTyping: boolean) => void;
  onFocus?: () => void;
  disabled?: boolean;
  placeholder?: string;
}
