/**
 * Zustand Store - Centralized State Management
 * Single store pattern with slices
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { authSlice, AuthSlice } from './slices/authSlice';
import { chatSlice, ChatSlice } from './slices/chatSlice';
import { notificationSlice, NotificationSlice } from './slices/notificationSlice';

// Combined Store Type
export type Store = AuthSlice & ChatSlice & NotificationSlice;

// Create Store with Middleware
export const useStore = create<Store>()(
  devtools(
    persist(
      (...a) => ({
        ...authSlice(...a),
        ...chatSlice(...a),
        ...notificationSlice(...a),
      }),
      {
        name: 'jyotish-store',
        partialize: (state) => ({
          // Only persist auth and theme
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'Jyotish Store' }
  )
);

// Selectors (for optimized re-renders)
export const selectAuth = (state: Store) => ({
  user: state.user,
  token: state.token,
  isAuthenticated: state.isAuthenticated,
  isLoading: state.isLoading,
});

export const selectChat = (state: Store) => ({
  conversations: state.conversations,
  activeChat: state.activeChat,
  messages: state.messages,
  onlineUsers: state.onlineUsers,
});

export const selectNotifications = (state: Store) => ({
  notifications: state.notifications,
  unreadCount: state.unreadCount,
});

