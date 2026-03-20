/**
 * Jyotish Dashboard Page - Main dashboard for astrologers
 * Eye-catching layout with hero, stats, quick actions, tip, and recent activity
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { JyotishLayout } from '@/components/layouts/JyotishLayout';
import { useRequireAuth } from '@/hooks';
import { USER_ROLES, QUERY_KEYS, ROUTES } from '@/constants';
import { LoadingScreenWithBackground } from '@/components/ui';
import {
  StatsCard,
  QuickActions,
  RecentActivity,
  WelcomeHero,
  DashboardTip,
} from '@/components/features/jyotish-dashboard';
import jyotishDashboardService from '@/services/jyotishDashboard.service';
import { useQuestionnaireLanguageStore } from '@/store/questionnaire-language.store';
import { CalendarDays, MessageSquare, TrendingUp, Clock, ArrowRight } from 'lucide-react';

export default function JyotishDashboardPage() {
  const { user, isCheckingAccess } = useRequireAuth({
    requiredRole: USER_ROLES.ASTROLOGER,
  });
  const language = useQuestionnaireLanguageStore((s) => s.language);

  const {
    data: stats,
    isLoading: isLoadingStats,
  } = useQuery({
    queryKey: [...QUERY_KEYS.JYOTISH_DASHBOARD.STATS, language],
    queryFn: () => jyotishDashboardService.getDashboardStats(language),
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (isCheckingAccess) {
    return <LoadingScreenWithBackground message="Verifying access..." />;
  }

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
      <div className="space-y-8">
        {/* Hero Welcome */}
        <WelcomeHero name={user?.name || 'Jyotish'} />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Today's Consultations"
            value={stats?.todaysConsultations.total ?? 0}
            subtitle={
              stats
                ? `${stats.todaysConsultations.completed} completed, ${stats.todaysConsultations.upcoming} upcoming`
                : 'Loading...'
            }
            icon={CalendarDays}
            gradient="bg-violet-500/20 text-violet-400"
            borderColor="purple"
            isLoading={isLoadingStats}
            href={ROUTES.JYOTISH_CONSULTATIONS}
          />
          <StatsCard
            title="Total Consultations"
            value={stats?.totalConsultations ?? 0}
            subtitle="Lifetime completed"
            icon={Clock}
            gradient="bg-sky-500/20 text-sky-400"
            borderColor="blue"
            isLoading={isLoadingStats}
            href={ROUTES.JYOTISH_CONSULTATIONS}
          />
          <StatsCard
            title="Active Chats"
            value={stats?.pendingChats.total ?? 0}
            subtitle={
              stats && stats.pendingChats.total > 0
                ? `${stats.pendingChats.total} awaiting your reply`
                : 'All caught up'
            }
            icon={MessageSquare}
            gradient="bg-amber-500/20 text-amber-400"
            borderColor="orange"
            isLoading={isLoadingStats}
            href={ROUTES.JYOTISH_CHAT}
          />
          <StatsCard
            title="This Month's Earnings"
            value={
              stats
                ? formatEarnings(stats.monthlyEarnings.amount, stats.monthlyEarnings.currency)
                : formatEarnings(0, 'NPR')
            }
            subtitle={
              stats && stats.monthlyEarnings.changePercent !== 0
                ? `${stats.monthlyEarnings.changePercent > 0 ? '+' : ''}${stats.monthlyEarnings.changePercent}% from last month`
                : 'No change from last month'
            }
            icon={TrendingUp}
            gradient="bg-emerald-500/20 text-emerald-400"
            borderColor="green"
            isLoading={isLoadingStats}
            href={ROUTES.JYOTISH_EARNINGS}
          />
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Two columns: Tip + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <DashboardTip tipText={stats?.todayTip?.text} skipFetch />
            {/* Quick link to Chats */}
            <Link
              href={ROUTES.JYOTISH_CHAT}
              className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-white/[0.1] bg-black/30 backdrop-blur-sm px-4 py-3 text-[#fafaf9] hover:bg-amber-500/10 hover:border-amber-500/30 transition-all group"
            >
              <span className="text-sm font-medium">Go to Chats</span>
              <ArrowRight className="h-4 w-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="lg:col-span-2">
            <RecentActivity activities={stats?.recentActivity ?? []} isLoading={isLoadingStats} />
          </div>
        </div>
      </div>
    </JyotishLayout>
  );
}
