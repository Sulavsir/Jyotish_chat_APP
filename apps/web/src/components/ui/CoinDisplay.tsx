/**
 * Balance Display Component
 * Shows user's balance with Money icon
 */

'use client';

import React, { useState } from 'react';
import { Banknote } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { coinService } from '@/services/coin.service';
import { QUERY_KEYS } from '@/constants';
import { UserRole } from '@/types/user.types';
import { useAuthStore } from '@/store/auth-store';
import { CoinPurchaseModal } from '@/components/modals';
import { useClientDashboard } from '@/providers/ClientDashboardProvider';

interface CoinDisplayProps {
  themeColor?: 'purple' | 'orange' | 'yellow';
  className?: string;
}

export function CoinDisplay({
  themeColor: _themeColor = 'yellow',
  className = '',
}: CoinDisplayProps) {
  const user = useAuthStore((state) => state.user);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const dashboardStats = useClientDashboard();

  // Prefer balance from stats (single /dashboard/stats call) when in client layout.
  // Fall back to COINS.BALANCE only when outside ClientDashboardProvider (e.g. auth pages).
  const hasStatsBalance = dashboardStats?.stats?.balance !== undefined;
  const { data: balanceData, isLoading } = useQuery({
    queryKey: QUERY_KEYS.COINS.BALANCE,
    queryFn: () => coinService.getBalance(),
    enabled: user?.role === UserRole.CLIENT && !hasStatsBalance,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  const balance =
    (hasStatsBalance ? dashboardStats?.stats?.balance : balanceData?.balance) ?? 0;
  const isLoadingBalance = hasStatsBalance ? dashboardStats?.isLoading : isLoading;

  if (user?.role !== UserRole.CLIENT) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsPurchaseModalOpen(true)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-green-500/10 border-green-500/20 ${className} hover:bg-green-500/20 transition-colors`}
      >
        <Banknote className="h-4 w-4 text-green-400" />
        <span className="text-sm font-semibold text-green-400">
          {isLoadingBalance ? '...' : `Balance: ${balance}`}
        </span>
      </button>

      <CoinPurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        requiredCoins={1}
        mode="purchase"
      />
    </>
  );
}
