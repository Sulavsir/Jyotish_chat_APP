'use client';

/**
 * When a Full Kundali Review slot starts, the API opens the chat and emits
 * {@link KUNDALI_APPOINTMENT_SOCKET_EVENT.SESSION_READY}. Navigate to that chat so the session is visible immediately.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/auth-store';
import { WS_EVENTS, ROUTE_BUILDERS, USER_ROLES } from '@/constants';
import type { AppointmentSessionReadyPayload } from '@jyotish/shared';
import { toast } from 'sonner';

function isSessionReadyPayload(raw: unknown): raw is AppointmentSessionReadyPayload {
  if (typeof raw !== 'object' || raw === null) return false;
  const o = raw as Record<string, unknown>;
  return (
    typeof o.appointmentId === 'string' &&
    o.appointmentId.length > 0 &&
    typeof o.chatId === 'string' &&
    o.chatId.length > 0
  );
}

export function AppointmentSessionReadyBridge() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !user?.id) return;

    const handler = (payload: unknown) => {
      if (!isSessionReadyPayload(payload)) return;
      if (user.role !== USER_ROLES.CLIENT && user.role !== USER_ROLES.ASTROLOGER) return;
      const isAstrologer = user.role === USER_ROLES.ASTROLOGER;
      const path = isAstrologer
        ? ROUTE_BUILDERS.JYOTISH_CHAT_WITH_ID(payload.chatId)
        : ROUTE_BUILDERS.CHAT_WITH_ID(payload.chatId);
      toast.info('Your consultation is ready');
      router.push(path);
    };

    socket.on(WS_EVENTS.APPOINTMENT_SESSION_READY, handler);
    return () => {
      socket.off(WS_EVENTS.APPOINTMENT_SESSION_READY, handler);
    };
  }, [socket, user?.id, user?.role, router]);

  return null;
}
