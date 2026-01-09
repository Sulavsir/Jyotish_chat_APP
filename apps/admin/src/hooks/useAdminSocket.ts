/**
 * useAdminSocket Hook
 * React hook for using admin socket service
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { adminSocketService, AdminSocketEvents } from '../services/admin-socket.service';
import { useAdminStore } from '../store/admin-store';

export function useAdminSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const admin = useAdminStore((state) => state.admin);
  const socketRef = useRef(adminSocketService);

  // Connect to socket when admin is authenticated
  useEffect(() => {
    if (!admin) {
      // Not authenticated, disconnect if connected
      if (socketRef.current.isConnected()) {
        socketRef.current.disconnect();
        setIsConnected(false);
      }
      return;
    }

    // Admin is authenticated, connect if not already connected
    const connectSocket = async () => {
      if (!socketRef.current.isConnected() && !isConnecting) {
        setIsConnecting(true);
        setError(null);

        try {
          await socketRef.current.connect();
          setIsConnected(true);
          setIsConnecting(false);
          setError(null);
          console.log('✅ Admin socket connected successfully');
        } catch (err: any) {
          setIsConnected(false);
          setIsConnecting(false);
          setError(err.message);
          console.error('❌ Failed to connect admin socket:', err);
        }
      }
    };

    connectSocket();

    // Update connection status
    const socket = socketRef.current.getSocket();
    if (socket) {
      const handleConnect = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
      };

      const handleDisconnect = () => {
        setIsConnected(false);
        setIsConnecting(false); // Reset connecting state on disconnect
      };

      const handleConnectError = (err: Error) => {
        setIsConnected(false);
        setIsConnecting(false); // Reset connecting state on error
        setError(err.message);
      };

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('connect_error', handleConnectError);
      socket.on('error', handleConnectError);

      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('connect_error', handleConnectError);
        socket.off('error', handleConnectError);
      };
    }
  }, [admin]); // Removed isConnecting from dependencies to prevent loop

  // Subscribe to event
  const on = useCallback(<K extends keyof AdminSocketEvents>(
    event: K,
    callback: AdminSocketEvents[K]
  ) => {
    socketRef.current.on(event, callback);
  }, []);

  // Unsubscribe from event
  const off = useCallback(<K extends keyof AdminSocketEvents>(
    event: K,
    callback: AdminSocketEvents[K]
  ) => {
    socketRef.current.off(event, callback);
  }, []);

  // Emit event
  const emit = useCallback((event: string, data?: any) => {
    socketRef.current.emit(event, data);
  }, []);

  return {
    isConnected,
    isConnecting,
    error,
    on,
    off,
    emit,
    socket: socketRef.current.getSocket(),
  };
}

/**
 * useAdminSocketEvent Hook
 * Convenience hook for subscribing to a single event
 */
export function useAdminSocketEvent<K extends keyof AdminSocketEvents>(
  event: K,
  callback: AdminSocketEvents[K]
) {
  const { on, off } = useAdminSocket();

  useEffect(() => {
    on(event, callback);

    return () => {
      off(event, callback);
    };
  }, [event, callback, on, off]);
}

