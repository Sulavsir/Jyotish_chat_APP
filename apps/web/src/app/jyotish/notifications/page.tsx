'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { JyotishLayout } from '@/components/layouts/JyotishLayout';
import { Button, Card } from '@jyotish/ui';
import { apiClient } from '@/lib/api-client';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingButton } from '@/components/ui';
import { getNotificationDestination } from '@/utils/notification-navigation';

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
  metadata?: Record<string, unknown>;
}

export default function JyotishNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 10;
  const loadNotificationsMutation = useMutation({
    mutationFn: async (params: { reset: boolean; offset: number; filter: 'all' | 'unread' }) => {
      const { reset, offset, filter } = params;
      const currentOffset = reset ? 0 : offset;
      const response = await apiClient.get<any>(
        `/api/v1/notifications?limit=${LIMIT}&offset=${currentOffset}&unreadOnly=${filter === 'unread'}`
      );
      return { response, currentOffset, reset };
    },
    onSuccess: ({ response, currentOffset, reset }) => {
      const newNotifications: Notification[] = response?.notifications || [];

      if (reset) {
        setNotifications(newNotifications);
      } else {
        setNotifications((prev) => [...prev, ...newNotifications]);
      }

      setUnreadCount(response?.unreadCount || 0);
      setOffset(currentOffset + LIMIT);
      setHasMore(newNotifications.length === LIMIT);
    },
    onError: (error) => {
      console.error('Error loading notifications:', error);
      toast.error('Failed to load notifications');
    },
    onSettled: () => {
      setIsLoading(false);
      setIsLoadingMore(false);
    },
  });

  const loadNotifications = (reset: boolean) => {
    if (reset) {
      setIsLoading(true);
      setOffset(0);
      setNotifications([]);
    } else {
      setIsLoadingMore(true);
    }

    loadNotificationsMutation.mutate({ reset, offset, filter });
  };

  useEffect(() => {
    loadNotifications(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => apiClient.post('/api/v1/notifications/mark-all-read', {}),
    onSuccess: () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, count: 0 })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error('Failed to mark all as read');
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => apiClient.patch(`/api/v1/notifications/${id}/read`, {}),
    onSuccess: (_, id) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, count: 0 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    },
    onError: (error) => {
      console.error('Error:', error);
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/api/v1/notifications/${id}`),
    onSuccess: (_, id) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success('Notification deleted');
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error('Failed to delete');
    },
  });

  const deleteAllReadMutation = useMutation({
    mutationFn: async () => apiClient.delete('/api/v1/notifications/read'),
    onSuccess: () => {
      setNotifications((prev) => prev.filter((n) => !n.isRead));
      toast.success('All read notifications deleted');
      loadNotifications(true);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error('Failed to delete');
    },
  });

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const markAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const deleteNotification = (id: string) => {
    deleteNotificationMutation.mutate(id);
  };

  const deleteAllRead = () => {
    deleteAllReadMutation.mutate();
  };

  const openNotificationTarget = async (n: Notification) => {
    const path = getNotificationDestination({
      type: n.type,
      metadata: n.metadata,
      isAstrologer: true,
    });
    if (!path) return;
    try {
      if (!n.isRead) {
        await apiClient.patch(`/api/v1/notifications/${n.id}/read`, {});
        setNotifications((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, isRead: true, count: 1 } : x))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      router.push(path);
    } catch {
      toast.error('Could not open notification');
    }
  };

  const filteredNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  return (
    <JyotishLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Bell className="h-8 w-8" /> Notifications
            </h1>
            <p className="text-gray-400 mt-2">
              You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} className="bg-orange-600 hover:bg-orange-700">
                <CheckCheck className="h-4 w-4 mr-2" /> Mark All as Read
              </Button>
            )}
            {notifications.length > unreadCount && (
              <Button onClick={deleteAllRead} className="bg-red-600 hover:bg-red-700">
                <Trash2 className="h-4 w-4 mr-2" /> Delete Read
              </Button>
            )}
          </div>
        </div>

        <Card className="bg-black/40 backdrop-blur-md border-orange-500/30">
          <div className="p-4 border-b border-white/10 flex gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === 'all' ? 'bg-orange-600/40 text-white' : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === 'unread'
                  ? 'bg-orange-600/40 text-white'
                  : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-xl font-semibold text-white">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-orange-500/20">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 ${!notification.isRead ? 'bg-orange-900/20' : 'hover:bg-white/5'}`}
                >
                  <button
                    type="button"
                    onClick={() => void openNotificationTarget(notification)}
                    className="flex-1 text-left min-w-0 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className={`font-semibold ${!notification.isRead ? 'text-white' : 'text-gray-300'}`}
                      >
                        {notification.title}
                      </h3>
                      {notification.count && notification.count > 1 && (
                        <span className="bg-orange-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                          {notification.count}
                        </span>
                      )}
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      )}
                    </div>
                    <p
                      className={`text-sm ${!notification.isRead ? 'text-gray-200' : 'text-gray-400'}`}
                    >
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(
                        new Date(notification.lastUpdated || notification.createdAt),
                        { addSuffix: true }
                      )}
                    </p>
                  </button>
                  <div className="flex gap-2 flex-shrink-0">
                    {!notification.isRead && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="p-2 rounded-full text-orange-400 hover:bg-orange-800/50"
                        title="Mark as read"
                      >
                        <CheckCheck className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="p-2 rounded-full text-red-400 hover:bg-red-800/50"
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}

              {hasMore && (
                <div className="p-4">
                  <LoadingButton
                    onClick={() => loadNotifications(false)}
                    isLoading={isLoadingMore}
                    loadingText="Loading..."
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    Load More
                  </LoadingButton>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </JyotishLayout>
  );
}
