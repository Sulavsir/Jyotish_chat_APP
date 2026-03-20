/**
 * Notification Bell Component
 * Shows notification count and opens popover with recent notifications.
 *
 * Astrologer enhancements:
 * - Status badges on "New Chat Request" (BROADCAST_MESSAGE) notifications:
 *   Pending / Accepted by you / Accepted by others / Expired — updated in real time via socket.
 * - Click on a Pending notification → inline accept dialog so the astrologer can
 *   accept without leaving the current page (same flow as BroadcastMessageBar).
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, CheckCheck, Clock, CheckCircle2, XCircle, Users, Zap } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  LoadingButton,
} from '@jyotish/ui';
import { apiClient } from '@/lib/api-client';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/auth-store';
import { UserRole } from '@/types';
import { toast } from 'sonner';
import broadcastMessageService from '@/services/broadcastMessage.service';
import { BROADCAST_MESSAGE_EXPIRY_MS } from '@/constants/broadcastMessage.constants';
import { ROUTE_BUILDERS } from '@/constants';

// ─── localStorage helpers — persist "I accepted this" across remounts ────────

const MY_ACCEPTED_KEY = 'jyotish_myAcceptedBroadcastIds';

function addMyAcceptedId(userId: string, broadcastMsgId: string) {
  try {
    const raw = localStorage.getItem(`${MY_ACCEPTED_KEY}:${userId}`) ?? '[]';
    const ids: string[] = JSON.parse(raw);
    if (!ids.includes(broadcastMsgId)) {
      ids.push(broadcastMsgId);
      localStorage.setItem(`${MY_ACCEPTED_KEY}:${userId}`, JSON.stringify(ids));
    }
  } catch {
    // ignore
  }
}

function getMyAcceptedIds(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(`${MY_ACCEPTED_KEY}:${userId}`) ?? '[]';
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  lastUpdated?: string;
  count?: number;
  groupKey?: string;
  metadata?: any;
}

type NotificationsBundle = {
  notifications: Notification[];
  unreadCount: number;
};

// Prevent duplicate parallel REST calls when React mounts components more than once
// (React Strict Mode) or when multiple instances are rendered.
let sharedNotificationsFetch: Promise<NotificationsBundle> | null = null;
let sharedNotificationsFetchedAt = 0;
const NOTIF_FETCH_DEDUPE_MS = 1500;

interface NotificationSettings {
  notificationsEnabled: boolean;
  chatNotifications?: boolean;
  consultationNotifications?: boolean;
  paymentNotifications?: boolean;
  marketingNotifications?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  soundEnabled?: boolean;
}

// Dedupe the initial notification-settings fetch across strict-mode remounts.
let sharedNotificationSettingsFetch: Promise<NotificationSettings> | null = null;
let sharedNotificationSettingsFetchedAt = 0;
let sharedNotificationSettingsCache: NotificationSettings | null = null;
const NOTIF_SETTINGS_DEDUPE_MS = 5000;

type BroadcastStatus = 'PENDING' | 'ACCEPTED_BY_YOU' | 'ACCEPTED_BY_OTHERS' | 'EXPIRED';

interface AcceptTarget {
  notificationId: string;
  broadcastMessageId: string;
  clientName: string;
  requestMessage: string;
}

interface NotificationBellProps {
  themeColor?: 'purple' | 'orange';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isBroadcastExpired(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() > BROADCAST_MESSAGE_EXPIRY_MS;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function NotificationBell({ themeColor = 'purple' }: NotificationBellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const lastNotificationsLoadedAtRef = useRef<number>(0);

  // Status map: broadcastMessageId → status (astrologer only)
  const [broadcastStatuses, setBroadcastStatuses] = useState<Map<string, BroadcastStatus>>(
    new Map()
  );
  // Accept dialog state
  const [acceptTarget, setAcceptTarget] = useState<AcceptTarget | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  const { socket, isConnected } = useSocket();
  const isAstrologer = user?.role === UserRole.ASTROLOGER;
  // Poll notifications only while user is actively in chat routes.
  // This prevents `/api/v1/notifications*` spam on every dashboard page.
  const shouldPollNotifications =
    pathname === '/chat' ||
    pathname?.startsWith('/chat?') ||
    pathname === '/jyotish/chat' ||
    pathname?.startsWith('/jyotish/chat?');

  // Keep a ref so socket-event closures always see the latest user id
  // even if the effect hasn't re-run since the user was hydrated.
  const userIdRef = useRef<string | undefined>(user?.id);
  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user?.id]);

  // ─── Status helpers ─────────────────────────────────────────────────────

  const getBroadcastStatus = useCallback(
    (notification: Notification): BroadcastStatus | null => {
      if (!isAstrologer || notification.type !== 'BROADCAST_MESSAGE') return null;
      const msgId = notification.metadata?.broadcastMessageId as string | undefined;
      if (!msgId) return null;

      const tracked = broadcastStatuses.get(msgId);
      if (tracked) return tracked;
      // Fall back to time-based expiry check
      if (isBroadcastExpired(notification.createdAt)) return 'EXPIRED';
      return 'PENDING';
    },
    [isAstrologer, broadcastStatuses]
  );

  const markBroadcastIds = useCallback((ids: string[], status: BroadcastStatus) => {
    setBroadcastStatuses((prev) => {
      const next = new Map(prev);
      ids.forEach((id) => next.set(id, status));
      return next;
    });
  }, []);

  // ─── Notification loading + status hydration ────────────────────────────

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const now = Date.now();

      // De-dupe parallel calls: if another mount/effect already started fetching,
      // just await it instead of hitting the server again.
      let bundle: NotificationsBundle | null = null;
      if (sharedNotificationsFetch) {
        bundle = await sharedNotificationsFetch;
      } else if (now - sharedNotificationsFetchedAt < NOTIF_FETCH_DEDUPE_MS) {
        // Recent fetch already completed; skip re-fetch to protect your server.
        return;
      } else {
        sharedNotificationsFetch = (async () => {
          // Prefer socket hydration (no HTTP polling).
          if (socket && isConnected) {
            const payload = await new Promise<{
              notifications: unknown[];
              unreadCount: number;
            }>((resolve, reject) => {
              const timeout = setTimeout(
                () => reject(new Error('notifications:get timeout')),
                4000
              );
              socket.emit(
                'notifications:get',
                { limit: 5, offset: 0, unreadOnly: false },
                (res: { notifications: unknown[]; unreadCount: number }) => {
                  clearTimeout(timeout);
                  resolve({
                    notifications: res.notifications ?? [],
                    unreadCount: res.unreadCount ?? 0,
                  });
                }
              );
            });

            return {
              notifications: (payload.notifications ?? []) as Notification[],
              unreadCount: payload.unreadCount ?? 0,
            };
          }

          const res = await apiClient.get<any>('/api/v1/notifications?limit=5');
          const notifications = (res?.notifications ?? []) as Notification[];
          const unreadCount = res?.unreadCount ?? 0;
          return { notifications, unreadCount };
        })();

        bundle = await sharedNotificationsFetch;
      }

      if (!bundle) return;

      // Clear shared promise only when we created it.
      if (sharedNotificationsFetch) sharedNotificationsFetch = null;
      sharedNotificationsFetchedAt = now;

      setNotifications(bundle.notifications);
      setUnreadCount(bundle.unreadCount);
      lastNotificationsLoadedAtRef.current = Date.now();

      // Astrologer-only: hydrate broadcast statuses from the live pending list.
      if (isAstrologer && bundle.notifications.some((n) => n.type === 'BROADCAST_MESSAGE')) {
        try {
          type PendingBroadcast = { id: string };
          const pendingMessages: PendingBroadcast[] = await new Promise((resolve) => {
            if (!socket || !isConnected) return resolve([]);
            const timeout = setTimeout(() => resolve([]), 4000);
            socket.once('broadcast:pendingMessages', (messages: unknown[]) => {
              clearTimeout(timeout);
              const safe = (messages ?? []).filter(Boolean) as unknown[];
              resolve(
                safe
                  .map((m) => ({ id: (m as PendingBroadcast)?.id }))
                  .filter((x) => typeof x.id === 'string')
              );
            });
            socket.emit('broadcast:getPendingMessages');
          });

          const pendingIds = new Set(pendingMessages.map((m) => m.id));
          const myAccepted = user?.id ? getMyAcceptedIds(user.id) : new Set<string>();

          setBroadcastStatuses((prev) => {
            const next = new Map(prev);
            bundle.notifications.forEach((n) => {
              if (n.type !== 'BROADCAST_MESSAGE') return;
              const msgId = n.metadata?.broadcastMessageId as string | undefined;
              if (!msgId) return;
              // Socket event already gave a definitive status — preserve it
              if (next.has(msgId)) return;

              const acceptedByMe =
                n.metadata?.acceptedByCurrentUser === true || myAccepted.has(msgId);

              if (pendingIds.has(msgId)) {
                next.set(msgId, 'PENDING');
              } else if (acceptedByMe) {
                next.set(msgId, 'ACCEPTED_BY_YOU');
              } else if (isBroadcastExpired(n.createdAt)) {
                next.set(msgId, 'EXPIRED');
              } else {
                next.set(msgId, 'ACCEPTED_BY_OTHERS');
              }
            });
            return next;
          });
        } catch {
          // Status hydration is non-critical; fall back to time-based expiry check
        }
      }
    } catch (err) {
      console.error('[NotificationBell] Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAstrologer, user?.id, socket, isConnected]);

  // Check notification settings on mount
  useEffect(() => {
    let isCancelled = false;
    const run = async () => {
      const now = Date.now();
      if (
        sharedNotificationSettingsCache &&
        now - sharedNotificationSettingsFetchedAt < NOTIF_SETTINGS_DEDUPE_MS
      ) {
        setNotificationsEnabled(sharedNotificationSettingsCache.notificationsEnabled ?? true);
        return;
      }

      if (sharedNotificationSettingsFetch) {
        const s = await sharedNotificationSettingsFetch;
        if (isCancelled) return;
        setNotificationsEnabled(s?.notificationsEnabled ?? true);
        return;
      }

      sharedNotificationSettingsFetch = apiClient
        .get<NotificationSettings>('/api/v1/notification-settings')
        .then((s) => {
          sharedNotificationSettingsCache = s;
          sharedNotificationSettingsFetchedAt = Date.now();
          return s;
        })
        .catch(() => {
          const fallback: NotificationSettings = { notificationsEnabled: true };
          sharedNotificationSettingsCache = fallback;
          sharedNotificationSettingsFetchedAt = Date.now();
          return fallback;
        })
        .finally(() => {
          sharedNotificationSettingsFetch = null;
        });

      const s = await sharedNotificationSettingsFetch;
      if (isCancelled) return;
      setNotificationsEnabled(s?.notificationsEnabled ?? true);
    };

    void run();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Initial load (and optional polling) - we rely primarily on socket events for real-time updates.
  useEffect(() => {
    if (!notificationsEnabled) return;
    if (!shouldPollNotifications) return;
    loadNotifications();
  }, [notificationsEnabled, loadNotifications, shouldPollNotifications]);

  // ─── Socket listeners ────────────────────────────────────────────────────

  useEffect(() => {
    if (!socket || !isConnected || !notificationsEnabled) return;

    // Generic new notification
    const handleNew = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev.slice(0, 4)]);
      if (!notification.isRead) setUnreadCount((c) => c + 1);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, { body: notification.message, icon: '/icon.png' });
      }
    };

    // Astrologer accepted a message themselves → mark as ACCEPTED_BY_YOU + navigate
    const handleAcceptedByMe = (data: {
      message?: { id?: string };
      chat?: { id: string };
      allAcceptedMessageIds?: string[];
    }) => {
      const ids = data.allAcceptedMessageIds ?? (data.message?.id ? [data.message.id] : []);
      if (ids.length) {
        markBroadcastIds(ids, 'ACCEPTED_BY_YOU');
        const uid = userIdRef.current;
        if (uid) ids.forEach((id) => addMyAcceptedId(uid, id));
      }
      // Navigation is handled by BroadcastMessageBar — do NOT double-navigate here.
    };

    // Another astrologer accepted — remove from pending bar
    const handleAcceptedByOthers = (data: {
      messageId?: string;
      allAcceptedMessageIds?: string[];
      acceptedBy?: { id: string };
    }) => {
      const ids = data.allAcceptedMessageIds ?? (data.messageId ? [data.messageId] : []);
      if (!ids.length) return;
      // If this event was triggered by the current user accepting, mark as ACCEPTED_BY_YOU
      const currentUserId = userIdRef.current;
      const status: BroadcastStatus =
        currentUserId && data.acceptedBy?.id === currentUserId
          ? 'ACCEPTED_BY_YOU'
          : 'ACCEPTED_BY_OTHERS';
      markBroadcastIds(ids, status);
    };

    // requestAccepted notification from server (sent to other astrologers)
    const handleRequestAccepted = (data: {
      messageId?: string;
      allAcceptedMessageIds?: string[];
      acceptedBy?: { id: string };
    }) => {
      const ids = data.allAcceptedMessageIds ?? (data.messageId ? [data.messageId] : []);
      if (ids.length) {
        const currentUserId = userIdRef.current;
        const status: BroadcastStatus =
          currentUserId && data.acceptedBy?.id === currentUserId
            ? 'ACCEPTED_BY_YOU'
            : 'ACCEPTED_BY_OTHERS';
        markBroadcastIds(ids, status);
      }
      // Reload notifications to get the latest state
      void loadNotifications();
    };

    socket.on('notification:new', handleNew);
    socket.on('broadcast:messageAccepted', handleAcceptedByMe);
    socket.on('broadcast:messageAcceptedByAstrologer', handleAcceptedByOthers);
    socket.on('notification:requestAccepted', handleRequestAccepted);

    return () => {
      socket.off('notification:new', handleNew);
      socket.off('broadcast:messageAccepted', handleAcceptedByMe);
      socket.off('broadcast:messageAcceptedByAstrologer', handleAcceptedByOthers);
      socket.off('notification:requestAccepted', handleRequestAccepted);
    };
  }, [socket, isConnected, notificationsEnabled, markBroadcastIds, loadNotifications, router]);

  // ─── Accept action ───────────────────────────────────────────────────────

  const handleAcceptBroadcast = async () => {
    if (!acceptTarget) return;
    setIsAccepting(true);
    try {
      const result = await broadcastMessageService.acceptMessage(acceptTarget.broadcastMessageId);
      markBroadcastIds([acceptTarget.broadcastMessageId], 'ACCEPTED_BY_YOU');
      // Persist so status survives remounts / page refreshes
      const uid = userIdRef.current;
      if (uid) addMyAcceptedId(uid, acceptTarget.broadcastMessageId);
      setAcceptTarget(null);
      setIsOpen(false);
      toast.success('Chat request accepted!');
      if (result?.chat?.id) {
        router.push(ROUTE_BUILDERS.JYOTISH_CHAT_WITH_ID(result.chat.id));
      }
    } catch (error: unknown) {
      const msg = ((error as Error)?.message ?? '').toLowerCase();
      if (msg.includes('accepted') || msg.includes('expired') || msg.includes('no longer')) {
        // Message was already taken — update status so the badge reflects reality
        const wasExpired = isBroadcastExpired(
          notifications.find(
            (n) => n.metadata?.broadcastMessageId === acceptTarget.broadcastMessageId
          )?.createdAt ?? ''
        );
        markBroadcastIds(
          [acceptTarget.broadcastMessageId],
          wasExpired ? 'EXPIRED' : 'ACCEPTED_BY_OTHERS'
        );
        setAcceptTarget(null);
        toast.info(
          wasExpired
            ? 'This request has expired.'
            : 'This request was already accepted by another astrologer.'
        );
      } else {
        toast.error((error as Error)?.message ?? 'Failed to accept request');
      }
    } finally {
      setIsAccepting(false);
    }
  };

  // ─── Click handler ───────────────────────────────────────────────────────

  const handleNotificationClick = async (notification: Notification) => {
    if (isAstrologer && notification.type === 'BROADCAST_MESSAGE') {
      const status = getBroadcastStatus(notification);
      if (status === 'PENDING') {
        const msgId = notification.metadata?.broadcastMessageId as string | undefined;
        if (msgId) {
          setAcceptTarget({
            notificationId: notification.id,
            broadcastMessageId: msgId,
            clientName: 'Client',
            requestMessage: 'A client is requesting to chat with an astrologer.',
          });
          return;
        }
      }
    }

    // Default: mark read + navigate
    try {
      const countToDecrement = notification.count || 1;
      await apiClient.patch(`/api/v1/notifications/${notification.id}/read`, {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true, count: 1 } : n))
      );
      setUnreadCount((c) => Math.max(0, c - countToDecrement));
      setIsOpen(false);
      const path = getNotificationPath(notification);
      if (path) router.push(path);
      setTimeout(loadNotifications, 500);
    } catch {
      toast.error('Failed to mark notification as read');
      void loadNotifications();
    }
  };

  // ─── Mark all read ───────────────────────────────────────────────────────

  const markAllAsRead = async () => {
    try {
      await apiClient.post('/api/v1/notifications/mark-all-read', {});
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, count: 1 })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
      setTimeout(loadNotifications, 500);
    } catch {
      toast.error('Failed to mark all as read');
      void loadNotifications();
    }
  };

  // ─── Navigation paths ────────────────────────────────────────────────────

  const getNotificationPath = (notification: Notification): string | null => {
    const { type, metadata } = notification;
    const prefix = isAstrologer ? '/jyotish' : '';
    if (type === 'CHAT_MESSAGE' || type === 'NEW_MESSAGE') {
      return metadata?.chatId ? `${prefix}/chat?chatId=${metadata.chatId}` : `${prefix}/chat`;
    }
    if (type === 'SYSTEM' && metadata?.chatId && metadata?.event === 'SESSION_STARTED') {
      return `${prefix}/chat?chatId=${metadata.chatId}`;
    }
    if (type === 'CONSULTATION_BOOKED' || type === 'CONSULTATION_REMINDER') {
      return metadata?.consultationId
        ? `${prefix}/consultations/${metadata.consultationId}`
        : `${prefix}/consultations`;
    }
    if (type === 'PAYMENT_RECEIVED' || type === 'PAYMENT_SUCCESS') {
      return `${prefix}/transactions`;
    }
    return `${prefix}/notifications`;
  };

  // ─── Status badge ────────────────────────────────────────────────────────

  function StatusBadge({ status }: { status: BroadcastStatus }) {
    const configs: Record<
      BroadcastStatus,
      { label: string; className: string; Icon: React.FC<{ className?: string }> }
    > = {
      PENDING: {
        label: 'Pending',
        className:
          'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-700',
        Icon: Clock,
      },
      ACCEPTED_BY_YOU: {
        label: 'Accepted by you',
        className:
          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700',
        Icon: CheckCircle2,
      },
      ACCEPTED_BY_OTHERS: {
        label: 'Accepted by others',
        className:
          'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-700',
        Icon: Users,
      },
      EXPIRED: {
        label: 'Expired',
        className:
          'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700',
        Icon: XCircle,
      },
    };
    const { label, className, Icon } = configs[status];
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${className}`}
      >
        <Icon className="h-3 w-3" />
        {label}
      </span>
    );
  }

  // ─── Color scheme ────────────────────────────────────────────────────────

  const colorClasses = {
    purple: {
      bg: 'bg-purple-600',
      hover: 'hover:bg-purple-700',
      text: 'text-purple-600',
      badge: 'bg-purple-500',
    },
    orange: {
      bg: 'bg-orange-600',
      hover: 'hover:bg-orange-700',
      text: 'text-orange-600',
      badge: 'bg-orange-500',
    },
  };
  const colors = colorClasses[themeColor];

  if (!notificationsEnabled) return null;

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      <Popover
        open={isOpen}
        onOpenChange={(o) => {
          setIsOpen(o);
          if (!o) return;
          const shouldReload =
            notifications.length === 0 ||
            Date.now() - lastNotificationsLoadedAtRef.current > 60_000;
          if (shouldReload) void loadNotifications();
        }}
      >
        <PopoverTrigger asChild>
          <button
            className={`relative p-2 rounded-lg transition-colors ${colors.hover} bg-white/10 text-white`}
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span
                className={`absolute -top-1 -right-1 ${colors.badge} text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold`}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent className="w-96 p-0" align="end">
          <div className="bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div>
                <h3 className="text-lg font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5">{unreadCount} unread</p>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${colors.bg} ${colors.hover} text-white`}
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => {
                    const broadcastStatus = getBroadcastStatus(notification);
                    const isClickablePending =
                      isAstrologer &&
                      notification.type === 'BROADCAST_MESSAGE' &&
                      broadcastStatus === 'PENDING';

                    return (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`w-full p-4 text-left transition-colors ${
                          !notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                        } ${
                          isClickablePending
                            ? 'hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1.5">
                            {isClickablePending ? (
                              <Zap className="h-4 w-4 text-emerald-500" />
                            ) : !notification.isRead ? (
                              <div className={`w-2 h-2 ${colors.bg} rounded-full mt-0.5`} />
                            ) : (
                              <div className="w-2 h-2" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {notification.title}
                              </p>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {broadcastStatus && <StatusBadge status={broadcastStatus} />}
                                {notification.count && notification.count > 1 && (
                                  <span
                                    className={`${colors.bg} text-white text-xs px-2 py-0.5 rounded-full font-bold`}
                                  >
                                    {notification.count}
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                              {notification.message}
                            </p>
                            {isClickablePending && (
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                                Tap to accept this request →
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {(() => {
                                try {
                                  const d = notification.lastUpdated || notification.createdAt;
                                  if (!d) return 'Just now';
                                  const date = new Date(d);
                                  if (isNaN(date.getTime())) return 'Just now';
                                  return formatDistanceToNow(date, { addSuffix: true });
                                } catch {
                                  return 'Just now';
                                }
                              })()}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t px-4 py-2">
                <Link
                  href={isAstrologer ? '/jyotish/notifications' : '/notifications'}
                  className={`text-sm ${colors.text} hover:underline block text-center`}
                  onClick={() => setIsOpen(false)}
                >
                  View all notifications
                </Link>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Accept broadcast request dialog */}
      <Dialog
        open={!!acceptTarget}
        onOpenChange={(o) => {
          if (!o) setAcceptTarget(null);
        }}
      >
        <DialogContent className="max-w-sm bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-emerald-500" />
              Accept Chat Request
            </DialogTitle>
            <DialogDescription>
              A client is waiting for an astrologer to accept their chat request.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <p className="font-medium text-gray-900 dark:text-white">New Chat Request</p>
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              Accept to start a private chat with this client.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setAcceptTarget(null)} disabled={isAccepting}>
              Cancel
            </Button>
            <LoadingButton
              onClick={handleAcceptBroadcast}
              loading={isAccepting}
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:opacity-90 text-white"
            >
              Accept Request
            </LoadingButton>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
