/**
 * Notification Bell Component
 * Shows notification count and opens popover with recent notifications
 */

'use client';

import { useState, useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@jyotish/ui';
import { Button } from '@jyotish/ui';
import { apiClient } from '@/lib/api-client';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/auth-store';
import { UserRole } from '@/types';
import { toast } from 'sonner';

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

interface NotificationBellProps {
  themeColor?: 'purple' | 'orange';
}

export function NotificationBell({ themeColor = 'purple' }: NotificationBellProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { socket, isConnected } = useSocket();

  // Check if user is astrologer
  const isAstrologer = user?.role === UserRole.ASTROLOGER;

  // Check if notifications are enabled
  useEffect(() => {
    const checkNotificationSettings = async () => {
      try {
        const settings = await apiClient.get<NotificationSettings>('/api/v1/notification-settings');
        setNotificationsEnabled(settings?.notificationsEnabled ?? true);
      } catch (error) {
        console.error('Error checking notification settings:', error);
        // Default to enabled if API fails
        setNotificationsEnabled(true);
      }
    };

    checkNotificationSettings();
  }, []);

  // Load notifications
  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const [notifResponse, countResponse] = await Promise.all([
        apiClient.get<any>('/api/v1/notifications?limit=5'),
        apiClient.get<any>('/api/v1/notifications/unread-count'),
      ]);

      const notifications = notifResponse?.notifications || [];
      const count = countResponse?.count || 0;

      setNotifications(notifications);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load notifications on mount and when enabled changes
  useEffect(() => {
    if (!notificationsEnabled) return;
    
    loadNotifications();

    // Auto-refresh every 30 seconds
    const intervalId = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationsEnabled]);

  // Real-time notification updates via Socket.io
  useEffect(() => {
    if (!socket || !isConnected || !notificationsEnabled) return;

    const handleNewNotification = (notification: Notification) => {
      // Add new notification to the list (at the beginning)
      setNotifications((prev) => [notification, ...prev.slice(0, 4)]);

      // Increment unread count if notification is unread
      if (!notification.isRead) {
        setUnreadCount((prev) => prev + 1);
      }

      // Optional: Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icon.png',
        });
      }
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket, isConnected, notificationsEnabled]);

  // Get navigation path based on notification type, metadata, and user role
  const getNotificationPath = (notification: Notification): string | null => {
    const { type, metadata } = notification;
    
    // Determine route prefix based on user role
    const routePrefix = isAstrologer ? '/jyotish' : '';

    // Chat notifications
    if (type === 'CHAT_MESSAGE' || type === 'NEW_MESSAGE') {
      if (metadata?.chatId) {
        return `${routePrefix}/chat?chatId=${metadata.chatId}`;
      }
      return `${routePrefix}/chat`;
    }

    // Consultation notifications
    if (type === 'CONSULTATION_BOOKED' || type === 'CONSULTATION_REMINDER') {
      if (metadata?.consultationId) {
        return `${routePrefix}/consultations/${metadata.consultationId}`;
      }
      return `${routePrefix}/consultations`;
    }

    // Payment notifications
    if (type === 'PAYMENT_RECEIVED' || type === 'PAYMENT_SUCCESS') {
      return `${routePrefix}/transactions`;
    }

    // Default to notifications page (role-specific)
    return `${routePrefix}/notifications`;
  };

  // Mark notification as read and navigate
  const handleNotificationClick = async (notification: Notification) => {
    try {
      const countToDecrement = notification.count || 1;
      
      // Mark as read on backend
      await apiClient.patch(`/api/v1/notifications/${notification.id}/read`, {});
      
      // Update local state immediately for better UX
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true, count: 1 } : n))
      );
      
      setUnreadCount((prev) => Math.max(0, prev - countToDecrement));
      
      // Close popover
      setIsOpen(false);
      
      // Navigate to the relevant page
      const path = getNotificationPath(notification);
      if (path) {
        router.push(path);
      }
      
      // Reload notifications from backend to ensure sync
      setTimeout(() => {
        loadNotifications();
      }, 500);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
      // Reload to revert any optimistic updates
      loadNotifications();
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await apiClient.post('/api/v1/notifications/mark-all-read', {});
      
      // Update local state immediately
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, count: 1 })));
      setUnreadCount(0);
      
      toast.success('All notifications marked as read');
      
      // Reload from backend to ensure sync
      setTimeout(() => {
        loadNotifications();
      }, 500);
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
      // Reload to revert any optimistic updates
      loadNotifications();
    }
  };

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

  // Don't show the bell if notifications are disabled
  if (!notificationsEnabled) {
    return null;
  }

  // Refresh notifications when popover opens
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      loadNotifications();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
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

          {/* Notifications List */}
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
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      !notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {!notification.isRead && (
                          <div className={`w-2 h-2 ${colors.bg} rounded-full mt-2`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white flex-1">
                            {notification.title}
                          </p>
                          {notification.count && notification.count > 1 && (
                            <span
                              className={`${colors.bg} text-white text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0`}
                            >
                              {notification.count}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {(() => {
                            try {
                              const dateStr = notification.lastUpdated || notification.createdAt;
                              if (!dateStr) return 'Just now';
                              const date = new Date(dateStr);
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
                ))}
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
  );
}
