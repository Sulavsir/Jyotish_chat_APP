/**
 * useSocket Hook - Socket.IO connection management
 *
 * IMPORTANT:
 * Many components call `useSocket()`. If each hook instance creates a new socket connection,
 * you get polling spam + duplicated events + duplicated REST reloads.
 *
 * This file enforces a single shared socket instance (singleton) across the app.
 */

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/store';
import { useAuthStore } from '@/store/auth-store';
import { WS_BASE_URL, WS_EVENTS, QUERY_KEYS } from '@/constants';
import type { Notification } from '@/types';
import { toast } from 'sonner';
import type { AstrologerListResponse } from '@/types/astrologer';
import type { ChatableUser } from '@/services/user.service';
import type { PublicAstrologerProfile } from '@/types/astrologer';

let sharedSocket: Socket | null = null;
let sharedConsumers = 0;
let sharedListenersAttached = false;
let sharedIsConnected = false;
let sharedQueryClient: ReturnType<typeof useQueryClient> | null = null;

const isConnectedSubscribers = new Set<(connected: boolean) => void>();

function publishConnected(next: boolean) {
  sharedIsConnected = next;
  for (const cb of isConnectedSubscribers) cb(next);
}

function getStoreActions() {
  const state = useStore.getState();
  return {
    addMessage: state.addMessage as (chatId: string, message: any) => void,
    setUserTyping: state.setUserTyping as (senderId: string, isTyping: boolean) => void,
    addUserOnline: state.addUserOnline as (userId: string) => void,
    removeUserOnline: state.removeUserOnline as (userId: string) => void,
    addNotification: state.addNotification as (notification: Notification) => void,
  };
}

function ensureSocket() {
  if (sharedSocket) return sharedSocket;

  // Force websocket transport to avoid "polling" HTTP spam under load.
  sharedSocket = io(WS_BASE_URL, {
    withCredentials: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ['websocket'],
  });

  sharedSocket.on('connect', () => {
    console.log('✅ WebSocket connected');
    publishConnected(true);
  });

  sharedSocket.on('disconnect', () => {
    console.log('❌ WebSocket disconnected');
    publishConnected(false);
  });

  sharedSocket.on('connect_error', (error) => {
    console.error('❌ WebSocket connection error:', error);
    publishConnected(false);
  });

  return sharedSocket;
}

function attachListenersIfNeeded(socket: Socket) {
  if (sharedListenersAttached) return;
  sharedListenersAttached = true;

  // Chat events
  socket.on(WS_EVENTS.CHAT_RECEIVE, (message: any) => {
    const { addMessage } = getStoreActions();
    const chatId = message.chatId || [message.senderId, message.receiverId].sort().join('-');
    addMessage(chatId, message);

    // Browser notifications must only show for the actual receiver.
    const currentUserId = useAuthStore.getState().user?.id;
    if (currentUserId && message.receiverId === currentUserId) {
      if (
        typeof globalThis.Notification !== 'undefined' &&
        globalThis.Notification.permission === 'granted'
      ) {
        new globalThis.Notification('New Message', {
          body: String(message.content || '').substring(0, 50),
        });
      }
    }
  });

  socket.on(WS_EVENTS.CHAT_SENT, (message: any) => {
    const { addMessage } = getStoreActions();
    const chatId = message.chatId || [message.senderId, message.receiverId].sort().join('-');
    addMessage(chatId, message);
  });

  socket.on(WS_EVENTS.CHAT_TYPING_INDICATOR, ({ senderId, isTyping }) => {
    const { setUserTyping } = getStoreActions();
    setUserTyping(senderId, isTyping);
  });

  socket.on('chat:error', ({ message }) => {
    toast.error(message || 'Failed to send message');
  });

  // Initial online users list when connecting
  socket.on('user:onlineList', ({ userIds }: { userIds: string[] }) => {
    const { addUserOnline } = getStoreActions();
    console.log('📋 Received online users list:', userIds.length, 'users online');
    userIds.forEach((userId) => addUserOnline(userId));
  });

  socket.on(WS_EVENTS.USER_STATUS, ({ userId, status }) => {
    const { addUserOnline, removeUserOnline } = getStoreActions();
    console.log('👤 User status changed:', userId, status);
    if (status === 'online') addUserOnline(userId);
    else removeUserOnline(userId);
  });

  // Astrologer online/offline status changes (real-time updates for all users)
  socket.on(WS_EVENTS.ASTROLOGER_STATUS_CHANGED, ({ astrologerId, name, isOnline }) => {
    const { addUserOnline, removeUserOnline } = getStoreActions();
    if (isOnline) addUserOnline(astrologerId);
    else removeUserOnline(astrologerId);

    if (sharedQueryClient) {
      sharedQueryClient.setQueryData<ChatableUser[] | undefined>(
        QUERY_KEYS.USERS.CHATABLE,
        (prev) => {
          if (!prev) return prev;
          return prev.map((u) => (u.id === astrologerId ? { ...u, isOnline } : u));
        }
      );

      sharedQueryClient.setQueriesData<AstrologerListResponse | undefined>(
        { queryKey: ['astrologers', 'list'] },
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            astrologers: prev.astrologers.map((a) =>
              a.id === astrologerId ? { ...a, isOnline } : a
            ),
          };
        }
      );
    }

    const user = useAuthStore.getState().user;
    if (user?.role === 'ADMIN') {
      toast.info(`${name} is now ${isOnline ? 'online' : 'offline'}`, { duration: 3000 });
    }
  });

  // Astrologer profile updates (name/photo/etc) for real-time UI updates
  socket.on(
    WS_EVENTS.ASTROLOGER_UPDATED,
    (payload: { astrologerId: string; name?: string | null; profilePhoto?: string | null }) => {
      const { astrologerId, name, profilePhoto } = payload;

      if (sharedQueryClient) {
        sharedQueryClient.setQueryData<ChatableUser[] | undefined>(
          QUERY_KEYS.USERS.CHATABLE,
          (prev) => {
            if (!prev) return prev;
            return prev.map((u) =>
              u.id === astrologerId
                ? {
                    ...u,
                    ...(name !== undefined ? { name } : {}),
                    ...(profilePhoto !== undefined ? { profilePhoto } : {}),
                  }
                : u
            );
          }
        );

        sharedQueryClient.setQueriesData<AstrologerListResponse | undefined>(
          { queryKey: ['astrologers', 'list'] },
          (prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              astrologers: prev.astrologers.map((a) =>
                a.id === astrologerId
                  ? {
                      ...a,
                      ...(name !== undefined ? { name: name ?? a.name } : {}),
                      ...(profilePhoto !== undefined ? { profilePhoto } : {}),
                    }
                  : a
              ),
            };
          }
        );

        sharedQueryClient.setQueryData<{ astrologer: PublicAstrologerProfile } | undefined>(
          QUERY_KEYS.ASTROLOGERS.DETAIL(astrologerId),
          (prev) => {
            if (!prev) return prev;
            return {
              astrologer: {
                ...prev.astrologer,
                ...(name !== undefined ? { name: name ?? prev.astrologer.name } : {}),
                ...(profilePhoto !== undefined ? { profilePhoto } : {}),
              },
            };
          }
        );
      }
    }
  );

  // Notification events
  socket.on(WS_EVENTS.NOTIFICATION_NEW, (notification: Notification) => {
    const { addNotification } = getStoreActions();
    addNotification(notification);
  });
}

export function useSocket() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [isConnected, setIsConnected] = useState(sharedIsConnected);

  useEffect(() => {
    sharedQueryClient = queryClient;
    const cb = (connected: boolean) => setIsConnected(connected);
    isConnectedSubscribers.add(cb);
    cb(sharedIsConnected);
    return () => {
      isConnectedSubscribers.delete(cb);
    };
  }, [queryClient]);

  useEffect(() => {
    if (!isAuthenticated) return;
    sharedConsumers += 1;

    const socket = ensureSocket();
    attachListenersIfNeeded(socket);

    if (!socket.connected) socket.connect();

    return () => {
      sharedConsumers -= 1;
      if (sharedConsumers <= 0 && sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket = null;
        sharedListenersAttached = false;
        publishConnected(false);
        sharedConsumers = 0;
      }
    };
  }, [isAuthenticated]);

  const sendMessage = (receiverId: string, content: string, type: string = 'TEXT', metadata?: any) => {
    if (sharedSocket && isConnected) {
      sharedSocket.emit(WS_EVENTS.CHAT_SEND, { receiverId, content, type, metadata });
      return true;
    }
    toast.error('Not connected to chat server');
    return false;
  };

  const sendTypingIndicator = (receiverId: string, typing: boolean) => {
    if (sharedSocket && isConnected) {
      sharedSocket.emit(WS_EVENTS.CHAT_TYPING, { receiverId, isTyping: typing });
    }
  };

  const markMessagesAsRead = (messageIds: string[]) => {
    if (sharedSocket && isConnected) {
      sharedSocket.emit(WS_EVENTS.CHAT_MARK_READ, { messageIds });
    }
  };

  const joinRoom = (roomId: string) => {
    if (sharedSocket && isConnected) {
      sharedSocket.emit('chat:join-room', { roomId });
    }
  };

  const leaveRoom = (roomId: string) => {
    if (sharedSocket && isConnected) {
      sharedSocket.emit('chat:leave-room', { roomId });
    }
  };

  return {
    socket: sharedSocket,
    isConnected,
    sendMessage,
    sendTypingIndicator,
    markMessagesAsRead,
    joinRoom,
    leaveRoom,
  };
}
