'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { QUERY_KEYS, USER_ROLES } from '@/constants';
import { useSocket } from '@/hooks/useSocket';

/**
 * When the shared socket reconnects, refresh astrologer profile so `isOnline` matches the server
 * (socket layer sets DB online; this avoids a stale "offline" UI after refresh).
 */
export function useAstrologerPresenceSync() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { isConnected } = useSocket();
  const prevConnected = useRef(false);

  useEffect(() => {
    if (user?.role !== USER_ROLES.ASTROLOGER) return;
    if (isConnected && !prevConnected.current) {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ASTROLOGERS.PROFILE });
    }
    prevConnected.current = isConnected;
  }, [isConnected, queryClient, user?.role]);
}
