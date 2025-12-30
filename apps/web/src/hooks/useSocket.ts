/**
 * useSocket Hook - WebSocket connection management
 */

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useStore } from '@/store';
import { useAuthStore } from '@/store/auth-store';
import { WS_BASE_URL, WS_EVENTS } from '@/constants';
import type { ChatMessage, Notification } from '@/types';
import { toast } from 'sonner';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const addMessage = useStore((state) => state.addMessage);
  const setUserTyping = useStore((state) => state.setUserTyping);
  const addUserOnline = useStore((state) => state.addUserOnline);
  const removeUserOnline = useStore((state) => state.removeUserOnline);
  const addNotification = useStore((state) => state.addNotification);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsConnected(false);
      return;
    }

    // Connect to WebSocket
    // Socket.io will automatically send httpOnly cookies with the handshake request
    const socket = io(WS_BASE_URL, {
      withCredentials: true, // IMPORTANT: Send httpOnly cookies with handshake
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      setIsConnected(false);
    });

    // Chat events
    socket.on(WS_EVENTS.CHAT_RECEIVE, (message: any) => {
      // Use actual chatId from message
      const chatId = message.chatId || [message.senderId, message.receiverId].sort().join('-');
      addMessage(chatId, message);

      // Show toast notification for new message
      if (Notification.permission === 'granted') {
        new Notification('New Message', {
          body: message.content.substring(0, 50),
        });
      }
    });

    socket.on(WS_EVENTS.CHAT_SENT, (message: any) => {
      // Use actual chatId from message
      const chatId = message.chatId || [message.senderId, message.receiverId].sort().join('-');
      addMessage(chatId, message);
    });

    socket.on(WS_EVENTS.CHAT_TYPING_INDICATOR, ({ senderId, isTyping }) => {
      setUserTyping(senderId, isTyping);
    });

    socket.on('chat:error', ({ message }) => {
      toast.error(message || 'Failed to send message');
    });

    // User status events
    socket.on(WS_EVENTS.USER_STATUS, ({ userId, status }) => {
      if (status === 'online') {
        addUserOnline(userId);
      } else {
        removeUserOnline(userId);
      }
    });

    // Notification events
    socket.on(WS_EVENTS.NOTIFICATION_NEW, (notification: Notification) => {
      addNotification(notification);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [
    isAuthenticated,
    addMessage,
    setUserTyping,
    addUserOnline,
    removeUserOnline,
    addNotification,
  ]);

  // Send message
  const sendMessage = (
    receiverId: string,
    content: string,
    type: string = 'TEXT',
    metadata?: any
  ) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(WS_EVENTS.CHAT_SEND, {
        receiverId,
        content,
        type,
        metadata,
      });
      return true;
    } else {
      toast.error('Not connected to chat server');
      return false;
    }
  };

  // Send typing indicator
  const sendTypingIndicator = (receiverId: string, isTyping: boolean) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(WS_EVENTS.CHAT_TYPING, {
        receiverId,
        isTyping,
      });
    }
  };

  // Mark messages as read
  const markMessagesAsRead = (messageIds: string[]) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(WS_EVENTS.CHAT_MARK_READ, {
        messageIds,
      });
    }
  };

  // Join a chat room (for group chats in the future)
  const joinRoom = (roomId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('chat:join-room', { roomId });
    }
  };

  // Leave a chat room
  const leaveRoom = (roomId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('chat:leave-room', { roomId });
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    sendMessage,
    sendTypingIndicator,
    markMessagesAsRead,
    joinRoom,
    leaveRoom,
  };
}
