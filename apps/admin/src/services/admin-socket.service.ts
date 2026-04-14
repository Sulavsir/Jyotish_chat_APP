/**
 * Admin Socket Service
 * Singleton Socket.IO client for the admin panel — survives route changes; use {@link subscribeConnection} for UI.
 */

import { io, Socket } from 'socket.io-client';
import { ADMIN_SOCKET_EVENTS } from '@/constants/socket-events.constants';

const SOCKET_URL =
  process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_WS_URL || 'https://jotishapi.autonomoustechnology.net'
    : typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:4000`
      : 'http://localhost:4000';

/* eslint-disable @typescript-eslint/no-explicit-any -- socket.io payloads are validated at runtime */
export interface AdminSocketEvents {
  [ADMIN_SOCKET_EVENTS.STATS.UPDATE]: (data: any) => void;
  [ADMIN_SOCKET_EVENTS.SIDEBAR.INVALIDATE]: () => void;
  [ADMIN_SOCKET_EVENTS.CHAT.NEW]: (data: any) => void;
  [ADMIN_SOCKET_EVENTS.CHAT.UPDATE]: (data: any) => void;
  [ADMIN_SOCKET_EVENTS.CHAT.ENDED]: (data: any) => void;
  [ADMIN_SOCKET_EVENTS.CHAT.ABANDONED]: (data: {
    chatId: string;
    reason?: string;
    abandonedBy: string;
  }) => void;
  [ADMIN_SOCKET_EVENTS.CHAT.UNBLOCKED]: (data: { chatId: string }) => void;
  [ADMIN_SOCKET_EVENTS.CHAT.REOPENED]: (data: { chatId: string }) => void;
  [ADMIN_SOCKET_EVENTS.USER.NEW]: (data: any) => void;
  [ADMIN_SOCKET_EVENTS.USER.UPDATE]: (data: any) => void;
  [ADMIN_SOCKET_EVENTS.USER.STATUS]: (data: {
    userId: string;
    status: 'online' | 'offline';
  }) => void;
  [ADMIN_SOCKET_EVENTS.ASTROLOGER.NEW]: (data: any) => void;
  [ADMIN_SOCKET_EVENTS.ASTROLOGER.UPDATE]: (data: any) => void;
  [ADMIN_SOCKET_EVENTS.ASTROLOGER.STATUS_CHANGED]: (data: {
    astrologerId: string;
    isOnline: boolean;
  }) => void;
  [ADMIN_SOCKET_EVENTS.EARNING.NEW]: (data: any) => void;
  [ADMIN_SOCKET_EVENTS.EARNING.UPDATE]: (data: any) => void;
  [ADMIN_SOCKET_EVENTS.AUDIT_LOG.NEW]: (data: any) => void;
  [ADMIN_SOCKET_EVENTS.CONSULTATION.NEW]: (data: any) => void;
  [ADMIN_SOCKET_EVENTS.CONSULTATION.UPDATE]: (data: any) => void;
  [ADMIN_SOCKET_EVENTS.CHAT_AUDIT.NEW]: (data: any) => void;
  [ADMIN_SOCKET_EVENTS.CHAT_AUDIT.UPDATE]: (data: any) => void;
  [ADMIN_SOCKET_EVENTS.CHAT_AUDIT.CHAT_ENDED]: (data: any) => void;
  [ADMIN_SOCKET_EVENTS.BROADCAST.NEW]: (data: any) => void;
  [ADMIN_SOCKET_EVENTS.BROADCAST.UPDATE]: (data: any) => void;
  [ADMIN_SOCKET_EVENTS.ADMIN_CHAT.NEW_MESSAGE]: (data: {
    chatId: string;
    message: unknown;
    chat: any;
  }) => void;
  [ADMIN_SOCKET_EVENTS.ADMIN_CHAT.MESSAGE]: (data: { message: unknown; chat: any }) => void;
  [ADMIN_SOCKET_EVENTS.ADMIN_CHAT.JOINED]: (data: { chatId: string }) => void;
  [ADMIN_SOCKET_EVENTS.ADMIN_CHAT.TYPING]: (data: {
    userId: string;
    userName: string;
    isTyping: boolean;
  }) => void;
  [ADMIN_SOCKET_EVENTS.ADMIN_CHAT.ERROR]: (data: { message: string }) => void;
}

class AdminSocketService {
  private socket: Socket | null = null;
  private isConnecting = false;
  private connectPromise: Promise<Socket> | null = null;
  private eventListeners = new Map<string, Set<(...args: unknown[]) => void>>();
  private connectionSubscribers = new Set<() => void>();
  private lastError: string | null = null;

  subscribeConnection(listener: () => void): () => void {
    this.connectionSubscribers.add(listener);
    return () => {
      this.connectionSubscribers.delete(listener);
    };
  }

  private notifyConnection(): void {
    this.connectionSubscribers.forEach((cb) => {
      try {
        cb();
      } catch {
        /* ignore */
      }
    });
  }

  getLastError(): string | null {
    return this.lastError;
  }

  connect(): Promise<Socket> {
    if (this.socket?.connected) {
      return Promise.resolve(this.socket);
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = new Promise<Socket>((resolve, reject) => {
      this.isConnecting = true;
      this.lastError = null;

      console.log('📡 Connecting admin socket to:', SOCKET_URL);

      this.socket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 8000,
        timeout: 20000,
      });

      let settled = false;

      const timeoutId = setTimeout(() => {
        if (!settled) {
          settled = true;
          this.isConnecting = false;
          this.lastError = 'Admin socket connection timed out';
          if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
          }
          this.notifyConnection();
          reject(new Error(this.lastError));
        }
      }, 25000);

      this.socket.on('connect', () => {
        console.log('✅ Admin socket connected');
        clearTimeout(timeoutId);
        this.isConnecting = false;
        this.lastError = null;
        this.notifyConnection();
        this.reattachEventListeners();

        if (!settled) {
          settled = true;
          resolve(this.socket!);
        }
      });

      this.socket.on('disconnect', (reason: string) => {
        console.log('🔌 Admin socket disconnected:', reason);
        this.isConnecting = false;
        this.notifyConnection();

        if (reason === 'io server disconnect') {
          setTimeout(() => {
            this.socket?.connect();
          }, 1000);
        }
      });

      this.socket.on('connect_error', (error: Error) => {
        console.error('❌ Admin socket connection error:', error);
        this.isConnecting = false;
        this.lastError = error.message;
        this.notifyConnection();
      });

      this.socket.on('error', (error: Error) => {
        console.error('❌ Admin socket error:', error);
        this.lastError = error.message;
        this.notifyConnection();
      });
    }).finally(() => {
      this.connectPromise = null;
    });

    return this.connectPromise;
  }

  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting admin socket');
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.connectPromise = null;
    this.eventListeners.clear();
    this.lastError = null;
    this.notifyConnection();
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  on<K extends keyof AdminSocketEvents>(event: K, callback: AdminSocketEvents[K]): void {
    const key = String(event);
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, new Set());
    }
    const wrapped = callback as (...args: unknown[]) => void;
    this.eventListeners.get(key)!.add(wrapped);

    if (this.socket) {
      this.socket.on(key, wrapped as never);
      console.log(`📡 [AdminSocket] Attached listener for event: ${key}`);
    } else {
      console.log(`⏳ [AdminSocket] Queued listener for event: ${key} (socket not ready)`);
    }
  }

  off<K extends keyof AdminSocketEvents>(event: K, callback: AdminSocketEvents[K]): void {
    const key = String(event);
    const listeners = this.eventListeners.get(key);
    const wrapped = callback as (...args: unknown[]) => void;
    if (listeners) {
      listeners.delete(wrapped);
      if (listeners.size === 0) {
        this.eventListeners.delete(key);
      }
    }
    if (this.socket) {
      this.socket.off(key, wrapped as never);
    }
  }

  emit(event: string, data?: unknown): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data as never);
    } else {
      console.warn('⚠️ Cannot emit event: socket not connected');
    }
  }

  private reattachEventListeners(): void {
    if (!this.socket) {
      console.warn('⚠️ [AdminSocket] Cannot reattach listeners: socket is null');
      return;
    }

    const events = Array.from(this.eventListeners.keys());
    console.log(`🔄 [AdminSocket] Reattaching ${events.length} event listener(s):`, events);

    this.eventListeners.forEach((listeners, event) => {
      listeners.forEach((callback) => {
        this.socket!.off(event, callback as never);
        this.socket!.on(event, callback as never);
      });
    });

    console.log('✅ [AdminSocket] All event listeners re-attached after reconnection');
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const adminSocketService = new AdminSocketService();
