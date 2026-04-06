'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import {
  Button,
  Skeleton,
  UsersIcon,
  StarIcon,
  ChatIcon,
  MoneyIcon,
  DocumentIcon,
} from '@jyotish/ui';
import { ClipboardList } from 'lucide-react';
import { ADMIN_ROUTES, ADMIN_QUERY_KEYS } from '@/constants';
import { ADMIN_SOCKET_EVENTS } from '@/constants/socket-events.constants';
import type { DashboardStats } from '@/types';
import { useAdminSocket } from '@/hooks';
import { AdminRefreshButton } from '@/components/admin';

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { on, off, isConnected } = useAdminSocket();

  const {
    data,
    isLoading: isLoadingStats,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.DASHBOARD.STATS(),
    queryFn: () => adminApi.dashboard.stats(),
    select: (response) => response.stats,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const stats: DashboardStats | undefined = data;

  // Listen for real-time stats updates
  useEffect(() => {
    if (!isConnected) return;

    const handleSidebarInvalidate = () => {
      void refetch();
    };

    const handleStatsUpdate = (updatedStats: Partial<DashboardStats>) => {
      queryClient.setQueryData<{ stats: DashboardStats } | DashboardStats>(
        ADMIN_QUERY_KEYS.DASHBOARD.STATS(),
        (prev) => {
          if (!prev) {
            return stats ? { stats: { ...stats, ...updatedStats } } : prev;
          }

          const currentStats =
            'stats' in prev ? (prev.stats as DashboardStats) : (prev as DashboardStats);

          return {
            stats: {
              ...currentStats,
              ...updatedStats,
            },
          };
        }
      );
    };

    const handleNewUser = () => {
      queryClient.setQueryData<{ stats: DashboardStats } | DashboardStats>(
        ADMIN_QUERY_KEYS.DASHBOARD.STATS(),
        (prev) => {
          if (!prev) return prev;
          const currentStats =
            'stats' in prev ? (prev.stats as DashboardStats) : (prev as DashboardStats);
          return {
            stats: {
              ...currentStats,
              totalUsers: currentStats.totalUsers + 1,
              newUsersToday: currentStats.newUsersToday + 1,
            },
          };
        }
      );
    };

    const handleNewAstrologer = () => {
      queryClient.setQueryData<{ stats: DashboardStats } | DashboardStats>(
        ADMIN_QUERY_KEYS.DASHBOARD.STATS(),
        (prev) => {
          if (!prev) return prev;
          const currentStats =
            'stats' in prev ? (prev.stats as DashboardStats) : (prev as DashboardStats);
          return {
            stats: {
              ...currentStats,
              totalAstrologers: currentStats.totalAstrologers + 1,
            },
          };
        }
      );
    };

    const handleNewChat = () => {
      queryClient.setQueryData<{ stats: DashboardStats } | DashboardStats>(
        ADMIN_QUERY_KEYS.DASHBOARD.STATS(),
        (prev) => {
          if (!prev) return prev;
          const currentStats =
            'stats' in prev ? (prev.stats as DashboardStats) : (prev as DashboardStats);
          return {
            stats: {
              ...currentStats,
              activeChats: currentStats.activeChats + 1,
            },
          };
        }
      );
    };

    const handleChatEnded = () => {
      queryClient.setQueryData<{ stats: DashboardStats } | DashboardStats>(
        ADMIN_QUERY_KEYS.DASHBOARD.STATS(),
        (prev) => {
          if (!prev) return prev;
          const currentStats =
            'stats' in prev ? (prev.stats as DashboardStats) : (prev as DashboardStats);
          return {
            stats: {
              ...currentStats,
              activeChats: Math.max(currentStats.activeChats - 1, 0),
            },
          };
        }
      );
    };

    const handleNewEarning = (payload: { amount: number }) => {
      const { amount } = payload;
      queryClient.setQueryData<{ stats: DashboardStats } | DashboardStats>(
        ADMIN_QUERY_KEYS.DASHBOARD.STATS(),
        (prev) => {
          if (!prev) return prev;
          const currentStats =
            'stats' in prev ? (prev.stats as DashboardStats) : (prev as DashboardStats);
          return {
            stats: {
              ...currentStats,
              totalEarnings: currentStats.totalEarnings + amount,
              todayEarnings: currentStats.todayEarnings + amount,
            },
          };
        }
      );
    };

    const handleNewConsultation = () => {
      queryClient.setQueryData<{ stats: DashboardStats } | DashboardStats>(
        ADMIN_QUERY_KEYS.DASHBOARD.STATS(),
        (prev) => {
          if (!prev) return prev;
          const currentStats =
            'stats' in prev ? (prev.stats as DashboardStats) : (prev as DashboardStats);
          return {
            stats: {
              ...currentStats,
              todayConsultations: currentStats.todayConsultations + 1,
            },
          };
        }
      );
    };

    on('stats:update', handleStatsUpdate);
    on('user:new', handleNewUser);
    on('astrologer:new', handleNewAstrologer);
    on('chat:new', handleNewChat);
    on('chat:ended', handleChatEnded);
    on('earning:new', handleNewEarning);
    on('consultation:new', handleNewConsultation);
    on(ADMIN_SOCKET_EVENTS.SIDEBAR.INVALIDATE, handleSidebarInvalidate);

    return () => {
      off('stats:update', handleStatsUpdate);
      off('user:new', handleNewUser);
      off('astrologer:new', handleNewAstrologer);
      off('chat:new', handleNewChat);
      off('chat:ended', handleChatEnded);
      off('earning:new', handleNewEarning);
      off('consultation:new', handleNewConsultation);
      off(ADMIN_SOCKET_EVENTS.SIDEBAR.INVALIDATE, handleSidebarInvalidate);
    };
  }, [isConnected, on, off, queryClient, stats, refetch]);

  type StatCardConfig = {
    title: string;
    value: string | number;
    icon: ReactNode;
    color: string;
    route?: string;
    routeSearch?: string;
  };

  const statCards: StatCardConfig[] =
    stats == null
      ? []
      : [
          {
            title: 'Total Users',
            value: stats.totalUsers,
            icon: <UsersIcon className="w-8 h-8 text-red-400" />,
            color: 'from-purple-500 to-pink-500',
            route: ADMIN_ROUTES.USERS,
          },
          {
            title: 'New Users Today',
            value: stats.newUsersToday,
            icon: <UsersIcon className="w-8 h-8 text-emerald-400" />,
            color: 'from-emerald-400 to-teal-500',
            route: ADMIN_ROUTES.USERS,
          },
          {
            title: 'Total Astrologers',
            value: stats.totalAstrologers,
            icon: <StarIcon className="w-8 h-8 text-purple-400" />,
            color: 'from-pink-500 to-purple-500',
            route: ADMIN_ROUTES.ASTROLOGERS,
          },
          {
            title: 'Astrologers to Approve',
            value: stats.pendingAstrologerRegistrations,
            icon: <ClipboardList className="w-8 h-8 text-amber-400" />,
            color: 'from-amber-500 to-orange-600',
            route: ADMIN_ROUTES.ASTROLOGERS_REGISTRATION_REQUESTS,
          },
          {
            title: 'Active Chats',
            value: stats.activeChats,
            icon: <ChatIcon className="w-8 h-8 text-green-400" />,
            color: 'from-green-400 to-emerald-500',
            route: ADMIN_ROUTES.CHATS,
          },
          {
            title: 'Total Earnings (Astrologers)',
            value: `Nrs.${stats.totalEarnings}`,
            icon: <MoneyIcon className="w-8 h-8 text-yellow-400" />,
            color: 'from-yellow-400 to-orange-500',
            route: ADMIN_ROUTES.EARNINGS,
          },
          {
            title: "Today's Earnings (Astrologers)",
            value: `Nrs.${stats.todayEarnings}`,
            icon: <MoneyIcon className="w-8 h-8 text-emerald-300" />,
            color: 'from-emerald-300 to-lime-400',
            route: ADMIN_ROUTES.EARNINGS,
          },
          {
            title: 'Total Loaded (Platform)',
            value: `Nrs.${stats.platformTotalLoaded}`,
            icon: <MoneyIcon className="w-8 h-8 text-blue-300" />,
            color: 'from-blue-300 to-indigo-400',
            route: ADMIN_ROUTES.TRANSACTIONS,
          },
          {
            title: "Today's Loaded (Platform)",
            value: `Nrs.${stats.platformTodayLoaded}`,
            icon: <MoneyIcon className="w-8 h-8 text-teal-300" />,
            color: 'from-teal-300 to-cyan-400',
            route: ADMIN_ROUTES.TRANSACTIONS,
          },
          {
            title: 'Online Jyotish',
            value: stats.onlineAstrologers,
            icon: (
              <svg
                className="w-8 h-8 text-cyan-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z"
                />
              </svg>
            ),
            color: 'from-cyan-400 to-blue-500',
            route: ADMIN_ROUTES.ASTROLOGERS,
            routeSearch: '?online=true',
          },
          {
            title: "Today's Consultations",
            value: stats.todayConsultations,
            icon: (
              <svg
                className="w-8 h-8 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            ),
            color: 'from-blue-400 to-cyan-500',
            route: ADMIN_ROUTES.APPOINTMENTS,
          },
        ];

  const quickActions = [
    {
      title: 'Add Astrologer',
      description: 'Onboard a new cosmic advisor',
      icon: <StarIcon className="w-6 h-6 text-cosmic-purple" />,
      route: ADMIN_ROUTES.ASTROLOGERS_CREATE,
    },
    {
      title: 'Manage Astrologers',
      description: 'View & update astrologer profiles',
      icon: <StarIcon className="w-6 h-6 text-purple-300" />,
      route: ADMIN_ROUTES.ASTROLOGERS,
    },
    {
      title: 'Users',
      description: 'Manage registered clients',
      icon: <UsersIcon className="w-6 h-6 text-emerald-300" />,
      route: ADMIN_ROUTES.USERS,
    },
    {
      title: 'View Chats',
      description: 'Monitor active conversations',
      icon: <ChatIcon className="w-6 h-6 text-green-400" />,
      route: ADMIN_ROUTES.CHATS,
    },
    {
      title: 'Admin Chats',
      description: 'Support widget conversations',
      icon: <ChatIcon className="w-6 h-6 text-rose-300" />,
      route: ADMIN_ROUTES.ADMIN_CHATS,
    },
    {
      title: 'Chat Audit',
      description: 'Review chat activities',
      icon: <DocumentIcon className="w-6 h-6 text-sky-300" />,
      route: ADMIN_ROUTES.CHAT_AUDIT,
    },
    {
      title: 'Appointments',
      description: 'Monitor appointment audits',
      icon: <DocumentIcon className="w-6 h-6 text-indigo-300" />,
      route: ADMIN_ROUTES.APPOINTMENTS,
    },
    {
      title: 'Jyotish Bookings',
      description: 'Pandit, Vaastu & Katha requests',
      icon: <DocumentIcon className="w-6 h-6 text-fuchsia-300" />,
      route: ADMIN_ROUTES.JYOTISH_BOOKINGS,
    },
    {
      title: 'Website Contents',
      description: 'Manage dashboard copy & pages',
      icon: <DocumentIcon className="w-6 h-6 text-amber-300" />,
      route: ADMIN_ROUTES.WEBSITE_DASHBOARD_COPY,
    },
    {
      title: 'Complaints',
      description: 'Handle user issues & reports',
      icon: <DocumentIcon className="w-6 h-6 text-orange-300" />,
      route: ADMIN_ROUTES.COMPLAINTS,
    },
    {
      title: 'Audit Logs',
      description: 'Review platform activity',
      icon: <DocumentIcon className="w-6 h-6 text-yellow-400" />,
      route: ADMIN_ROUTES.AUDIT_LOGS,
    },
    {
      title: 'Manage Earnings',
      description: 'Process astrologer payouts',
      icon: <MoneyIcon className="w-6 h-6 text-blue-400" />,
      route: ADMIN_ROUTES.EARNINGS,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-5 sm:space-y-6 lg:space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-cosmic-purple to-nebula-pink bg-clip-text text-red-400">
              Dashboard Overview
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-1.5 sm:mt-2">
              Welcome back! Here's what's happening today.
            </p>
          </div>
          <AdminRefreshButton
            onClick={() => refetch()}
            loading={isRefetching}
            className="self-start sm:self-auto"
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {isLoadingStats && !stats
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="cosmic-card rounded-xl p-6">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <Skeleton className="h-10 w-20" />
                </div>
              ))
            : statCards.map((stat, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    if (!stat.route) return;
                    const href = stat.routeSearch ? `${stat.route}${stat.routeSearch}` : stat.route;
                    router.push(href);
                  }}
                  className="cosmic-card rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer text-left w-full"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-slate-400 text-xs sm:text-sm font-medium pr-2">
                      {stat.title}
                    </h3>
                    <span className="shrink-0">{stat.icon}</span>
                  </div>
                  <p
                    className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent break-words`}
                  >
                    {stat.value}
                  </p>
                </button>
              ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="ghost"
                onClick={() => router.push(action.route)}
                className="cosmic-card rounded-xl p-4 sm:p-5 lg:p-6 h-auto text-left justify-start md:hover:scale-105 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {action.icon}
                    <h4 className="text-white font-semibold text-sm sm:text-base">
                      {action.title}
                    </h4>
                  </div>
                  <p className="text-slate-400 text-xs sm:text-sm">{action.description}</p>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
