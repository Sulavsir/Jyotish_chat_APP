/**
 * Admin Socket Service
 * Handles real-time WebSocket connection for admin panel
 */

import { io, Socket } from 'socket.io-client';
import { ADMIN_SOCKET_EVENTS } from '@/constants/socket-events.constants';

// WebSocket URL configuration
// Production: Use environment variable (points to API server)
// Development: Use current hostname with port 4000 (supports localhost and network IP)
const SOCKET_URL =
  process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_WS_URL || 'https://jotishapi.autonomoustechnology.net'
    : typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:4000`
      : 'http://localhost:4000'; // SSR fallback

export interface AdminSocketEvents {
  // Dashboard events
  [ADMIN_SOCKET_EVENTS.STATS.UPDATE]: (data: any) => void;

  // Chat events
  [ADMIN_SOCKET_EVENTS.CHAT.NEW]: (data: any) => void;
  [ADMIN_SOCKET_EVENTS.CHAT.UPDATE]: (data: any) => void;
  [ADMIN_SOCKET_EVENTS.CHAT.ENDED]: (data: any) => void;
  [ADMIN_SOCKET_EVENTS.CHAT.ABANDONED]: (data: { chatId: string; reason?: string; abandonedBy: string }) => void;
  [ADMIN_SOCKET_EVENTS.CHAT.UNBLOCKED]: (data: { chatId: string }) => void;

  // User events
  [ADMIN_SOCKET_EVENTS.USER.NEW]: (data: any) => void;
  [ADMIN_SOCKET_EVENTS.USER.UPDATE]: (data: any) => void;
  [ADMIN_SOCKET_EVENTS.USER.STATUS]: (data: { userId: string; status: 'online' | 'offline' }) => void;

  // Astrologer events
  [ADMIN_SOCKET_EVENTS.ASTROLOGER.NEW]: (data: any) => void;
  [ADMIN_SOCKET_EVENTS.ASTROLOGER.UPDATE]: (data: any) => void;
  [ADMIN_SOCKET_EVENTS.ASTROLOGER.STATUS_CHANGED]: (data: { astrologerId: string; isOnline: boolean }) => void;

  // Earning events
  [ADMIN_SOCKET_EVENTS.EARNING.NEW]: (data: any) => void;
  [ADMIN_SOCKET_EVENTS.EARNING.UPDATE]: (data: any) => void;

  // Audit log events
  [ADMIN_SOCKET_EVENTS.AUDIT_LOG.NEW]: (data: any) => void;

  // Consultation events
  [ADMIN_SOCKET_EVENTS.CONSULTATION.NEW]: (data: any) => void;
  [ADMIN_SOCKET_EVENTS.CONSULTATION.UPDATE]: (data: any) => void;

  // Chat audit events
  [ADMIN_SOCKET_EVENTS.CHAT_AUDIT.NEW]: (data: any) => void;
  [ADMIN_SOCKET_EVENTS.CHAT_AUDIT.UPDATE]: (data: any) => void;
  [ADMIN_SOCKET_EVENTS.CHAT_AUDIT.CHAT_ENDED]: (data: any) => void;

  // Broadcast message events
  [ADMIN_SOCKET_EVENTS.BROADCAST.NEW]: (data: any) => void;
  [ADMIN_SOCKET_EVENTS.BROADCAST.UPDATE]: (data: any) => void;

  // Admin support chat (support widget)
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
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private eventListeners: Map<string, Set<Function>> = new Map();

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(this.socket);
        return;
      }

      if (this.isConnecting) {
        // Wait for the current connection attempt to complete
        const checkConnection = setInterval(() => {
          if (this.socket?.connected) {
            clearInterval(checkConnection);
            resolve(this.socket);
          } else if (!this.isConnecting) {
            clearInterval(checkConnection);
            reject(new Error('Connection failed'));
          }
        }, 100);
        return;
      }

      this.isConnecting = true;

      console.log('📡 Connecting admin socket to:', SOCKET_URL);

      this.socket = io(SOCKET_URL, {
        withCredentials: true, // Important: sends cookies
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      this.socket.on('connect', () => {
        console.log('✅ Admin socket connected');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        resolve(this.socket!);
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Admin socket connection error:', error);
        this.isConnecting = false;
        this.reconnectAttempts++;

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(new Error('Max reconnection attempts reached'));
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Admin socket disconnected:', reason);
        this.isConnecting = false;

        if (reason === 'io server disconnect') {
          // Server disconnected, need to reconnect manually
          setTimeout(() => {
            this.connect();
          }, this.reconnectDelay);
        }
      });

      this.socket.on('error', (error) => {
        console.error('❌ Admin socket error:', error);
      });

      // Re-attach event listeners after reconnection
      this.socket.on('connect', () => {
        this.reattachEventListeners();
      });
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting admin socket');
      this.socket.disconnect();
      this.socket = null;
      this.eventListeners.clear();
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Subscribe to an event
   */
  on<K extends keyof AdminSocketEvents>(event: K, callback: AdminSocketEvents[K]) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);

    if (this.socket) {
      this.socket.on(event, callback as any);
      console.log(`📡 [AdminSocket] Attached listener for event: ${event}`);
    } else {
      console.log(`⏳ [AdminSocket] Queued listener for event: ${event} (socket not ready)`);
    }
  }

  /**
   * Unsubscribe from an event
   */
  off<K extends keyof AdminSocketEvents>(event: K, callback: AdminSocketEvents[K]) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    }

    if (this.socket) {
      this.socket.off(event, callback as any);
    }
  }

  /**
   * Emit an event
   */
  emit(event: string, data?: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('⚠️ Cannot emit event: socket not connected');
    }
  }

  /**
   * Re-attach all event listeners after reconnection
   */
  private reattachEventListeners() {
    if (!this.socket) {
      console.warn('⚠️ [AdminSocket] Cannot reattach listeners: socket is null');
      return;
    }

    const events = Array.from(this.eventListeners.keys());
    console.log(`🔄 [AdminSocket] Reattaching ${events.length} event listener(s):`, events);

    this.eventListeners.forEach((listeners, event) => {
      listeners.forEach((callback) => {
        // Prevent duplicate listeners on reconnects
        this.socket!.off(event, callback as any);
        this.socket!.on(event, callback as any);
        console.log(`  ✓ Reattached listener for: ${event}`);
      });
    });

    console.log('✅ [AdminSocket] All event listeners re-attached after reconnection');
  }

  /**
   * Get socket instance (for advanced usage)
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance
export const adminSocketService = new AdminSocketService();
