/**
 * Admin Socket Service
 * Handles real-time WebSocket connection for admin panel
 */

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface AdminSocketEvents {
  // Dashboard events
  'stats:update': (data: any) => void;

  // Chat events
  'chat:new': (data: any) => void;
  'chat:update': (data: any) => void;

  // User events
  'user:new': (data: any) => void;
  'user:update': (data: any) => void;
  'user:status': (data: { userId: string; status: 'online' | 'offline' }) => void;

  // Astrologer events
  'astrologer:new': (data: any) => void;
  'astrologer:update': (data: any) => void;
  'astrologer:status': (data: { astrologerId: string; isOnline: boolean }) => void;

  // Earning events
  'earning:new': (data: any) => void;
  'earning:update': (data: any) => void;

  // Audit log events
  'auditLog:new': (data: any) => void;

  // Consultation events
  'consultation:new': (data: any) => void;
  'consultation:update': (data: any) => void;

  // Chat audit events
  'chatAudit:new': (data: any) => void;
  'chatAudit:update': (data: any) => void;
  'chatAudit:chatEnded': (data: any) => void;

  // Broadcast message events
  'broadcast:new': (data: any) => void;
  'broadcast:update': (data: any) => void;
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
    if (!this.socket) return;

    this.eventListeners.forEach((listeners, event) => {
      listeners.forEach((callback) => {
        this.socket!.on(event, callback as any);
      });
    });

    console.log('🔄 Re-attached event listeners after reconnection');
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
