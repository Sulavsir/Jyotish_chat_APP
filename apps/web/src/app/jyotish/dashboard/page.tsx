/**
 * Jyotish Dashboard Page - Main dashboard for astrologers
 * Refactored with dynamic data fetching, TanStack Query, and improved design
 */

'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { JyotishLayout } from '@/components/layouts/JyotishLayout';
import { useRequireAuth } from '@/hooks';
import { USER_ROLES, QUERY_KEYS } from '@/constants';
import { LoadingScreenWithBackground } from '@/components/ui';
import { StatsCard, QuickActions, RecentActivity } from '@/components/features/jyotish-dashboard';
import jyotishDashboardService from '@/services/jyotishDashboard.service';
import { CalendarDays, MessageSquare, TrendingUp, Clock } from 'lucide-react';

export default function JyotishDashboardPage() {
  const { user, isCheckingAccess } = useRequireAuth({
    requiredRole: USER_ROLES.ASTROLOGER,
  });

  // Fetch dashboard stats
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
  } = useQuery({
    queryKey: QUERY_KEYS.JYOTISH_DASHBOARD.STATS,
    queryFn: () => jyotishDashboardService.getDashboardStats(),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Fetch recent activity
  const {
    data: recentActivity = [],
    isLoading: isLoadingActivity,
  } = useQuery({
    queryKey: QUERY_KEYS.JYOTISH_DASHBOARD.RECENT_ACTIVITY(5),
    queryFn: () => jyotishDashboardService.getRecentActivity(5),
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });

  // Show loading state while checking access
  if (isCheckingAccess) {
    return <LoadingScreenWithBackground message="Verifying access..." />;
  }

  // Format earnings with currency
  const formatEarnings = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <JyotishLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">
            Welcome, {user?.name || 'Jyotish'}! 🙏
          </h1>
          <p className="text-gray-300">
            Manage your consultations, clients, and astrological services
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Today's Consultations"
            value={stats?.todaysConsultations.total ?? 0}
            subtitle={
              stats
                ? `${stats.todaysConsultations.completed} completed, ${stats.todaysConsultations.upcoming} upcoming`
                : 'Loading...'
            }
            icon={CalendarDays}
            gradient="from-purple-600/80 to-purple-800/80"
            borderColor="purple"
            isLoading={isLoadingStats}
          />

          <StatsCard
            title="Total Consultations"
            value={stats?.totalConsultations ?? 0}
            subtitle="Lifetime completed"
            icon={Clock}
            gradient="from-blue-600/80 to-blue-800/80"
            borderColor="blue"
            isLoading={isLoadingStats}
          />

          <StatsCard
            title="Pending Chats"
            value={stats?.pendingChats.total ?? 0}
            subtitle={
              stats && stats.pendingChats.urgent > 0
                ? `${stats.pendingChats.urgent} require urgent response`
                : 'All caught up'
            }
            icon={MessageSquare}
            gradient="from-orange-600/80 to-orange-800/80"
            borderColor="orange"
            isLoading={isLoadingStats}
          />

          <StatsCard
            title="This Month's Earnings"
            value={
              stats
                ? formatEarnings(stats.monthlyEarnings.amount, stats.monthlyEarnings.currency)
                : formatEarnings(0, 'NPR')
            }
            subtitle={
              stats && stats.monthlyEarnings.changePercent > 0
                ? `+${stats.monthlyEarnings.changePercent}% from last month`
                : 'No change'
            }
            icon={TrendingUp}
            gradient="from-green-600/80 to-green-800/80"
            borderColor="green"
            isLoading={isLoadingStats}
          />
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Recent Activity */}
        <RecentActivity activities={recentActivity} isLoading={isLoadingActivity} />
      </div>
    </JyotishLayout>
  );
}
