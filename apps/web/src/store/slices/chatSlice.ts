/**
 * Chat Slice - Chat State Management
 */

import { StateCreator } from 'zustand';
import type { ChatMessage } from '@jyotish/shared';

interface Conversation {
  userId: string;
  userName: string;
  userEmail: string;
  userImage?: string;
  lastMessage: string;
  lastMessageTime: Date;
  isRead: boolean;
}

export interface ChatSlice {
  // State
  conversations: Conversation[];
  activeChat: string | null;
  messages: Record<string, ChatMessage[]>;
  onlineUsers: Set<string>;
  typingUsers: Set<string>;

  // Actions
  setConversations: (conversations: Conversation[]) => void;
  setActiveChat: (userId: string | null) => void;
  addMessage: (chatId: string, message: ChatMessage) => void;
  setMessages: (chatId: string, messages: ChatMessage[]) => void;
  addUserOnline: (userId: string) => void;
  removeUserOnline: (userId: string) => void;
  setUserTyping: (userId: string, isTyping: boolean) => void;
  markMessagesAsRead: (chatId: string, messageIds: string[]) => void;
  clearChat: () => void;
}

export const chatSlice: StateCreator<ChatSlice> = (set) => ({
  // Initial State
  conversations: [],
  activeChat: null,
  messages: {},
  onlineUsers: new Set(),
  typingUsers: new Set(),

  // Actions
  setConversations: (conversations) =>
    set({
      conversations,
    }),

  setActiveChat: (userId) =>
    set({
      activeChat: userId,
    }),

  addMessage: (chatId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [...(state.messages[chatId] || []), message],
      },
    })),

  setMessages: (chatId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: messages,
      },
    })),

  addUserOnline: (userId) =>
    set((state) => ({
      onlineUsers: new Set(state.onlineUsers).add(userId),
    })),

  removeUserOnline: (userId) =>
    set((state) => {
      const newOnlineUsers = new Set(state.onlineUsers);
      newOnlineUsers.delete(userId);
      return { onlineUsers: newOnlineUsers };
    }),

  setUserTyping: (userId, isTyping) =>
    set((state) => {
      const newTypingUsers = new Set(state.typingUsers);
      if (isTyping) {
        newTypingUsers.add(userId);
      } else {
        newTypingUsers.delete(userId);
      }
      return { typingUsers: newTypingUsers };
    }),

  markMessagesAsRead: (chatId, messageIds) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: state.messages[chatId]?.map((msg) =>
          messageIds.includes(msg.id) ? { ...msg, isRead: true } : msg
        ),
      },
    })),

  clearChat: () =>
    set({
      conversations: [],
      activeChat: null,
      messages: {},
      typingUsers: new Set(),
    }),
});

