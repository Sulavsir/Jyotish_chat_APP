/**
 * useAdminSocket Hook
 * Subscribes to the singleton admin socket — connection state is shared across all hook instances.
 */

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useSyncExternalStore,
} from 'react';
import { adminSocketService, AdminSocketEvents } from '../services/admin-socket.service';
import { useAdminStore } from '../store/admin-store';

export function useAdminSocket() {
  const isConnected = useSyncExternalStore(
    (onStoreChange) => adminSocketService.subscribeConnection(onStoreChange),
    () => adminSocketService.isConnected(),
    () => false
  );

  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const adminId = useAdminStore((state) => state.admin?.id ?? null);
  const hasHydrated = useAdminStore((state) => state._hasHydrated);
  const connectRef = useRef(0);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!adminId) {
      adminSocketService.disconnect();
      setIsConnecting(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const id = ++connectRef.current;

    const run = async () => {
      setIsConnecting(true);
      setError(null);
      try {
        await adminSocketService.connect();
        if (cancelled || id !== connectRef.current) return;
        setIsConnecting(false);
        setError(null);
      } catch (err) {
        if (cancelled || id !== connectRef.current) return;
        setIsConnecting(false);
        const message = err instanceof Error ? err.message : 'Failed to connect';
        setError(message);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [adminId, hasHydrated]);

  const lastErr = adminSocketService.getLastError();
  const displayError = error ?? (isConnected ? null : lastErr);

  const on = useCallback(<K extends keyof AdminSocketEvents>(
    event: K,
    callback: AdminSocketEvents[K]
  ) => {
    adminSocketService.on(event, callback);
  }, []);

  const off = useCallback(<K extends keyof AdminSocketEvents>(
    event: K,
    callback: AdminSocketEvents[K]
  ) => {
    adminSocketService.off(event, callback);
  }, []);

  const emit = useCallback((event: string, data?: unknown) => {
    adminSocketService.emit(event, data);
  }, []);

  return {
    isConnected,
    isConnecting,
    error: displayError,
    on,
    off,
    emit,
    socket: adminSocketService.getSocket(),
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
