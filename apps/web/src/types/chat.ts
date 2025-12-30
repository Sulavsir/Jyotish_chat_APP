export interface Chat {
  id: string;
  participant1Id: string;
  participant2Id: string;
  consultationId?: string;
  lastMessageAt?: Date;
  lastMessageText?: string;
  participant1Read: boolean;
  participant2Read: boolean;
  createdAt: Date;
  updatedAt: Date;
  participant1: {
    id: string;
    name: string;
    email?: string;
    phone: string;
    profilePhoto?: string;
    role: string;
  };
  participant2: {
    id: string;
    name: string;
    email?: string;
    phone: string;
    profilePhoto?: string;
    role: string;
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
  sender: {
    id: string;
    name: string;
    email?: string;
    profilePhoto?: string;
    role: string;
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
    sender: {
      id: string;
      name: string;
      profilePhoto?: string;
    };
  };
  isOwn: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
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
