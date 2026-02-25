/**
 * Coin Display Component
 * Shows user's coin balance
 */

'use client';

import React, { useState } from 'react';
import { Coins } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { coinService } from '@/services/coin.service';
import { QUERY_KEYS } from '@/constants';
import { UserRole } from '@/types/user.types';
import { useAuthStore } from '@/store/auth-store';
import { CoinPurchaseModal } from '@/components/modals';

interface CoinDisplayProps {
  themeColor?: 'purple' | 'orange' | 'yellow';
  className?: string;
}

export function CoinDisplay({
  themeColor: _themeColor = 'yellow',
  className = '',
}: CoinDisplayProps) {
  // Force yellow theme for coins
  const themeColor = 'yellow';
  const user = useAuthStore((state) => state.user);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  const { data: balanceData, isLoading } = useQuery({
    queryKey: QUERY_KEYS.COINS.BALANCE,
    queryFn: () => coinService.getBalance(),
    enabled: user?.role === UserRole.CLIENT,
    refetchInterval: 20000, // Refetch every 20 seconds
  });

  const balance = balanceData?.balance ?? 0;

  if (user?.role !== UserRole.CLIENT) {
    return null;
  }

  const colorClasses = {
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      text: 'text-purple-400',
      icon: 'text-purple-400',
    },
    orange: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
      text: 'text-orange-400',
      icon: 'text-orange-400',
    },
    yellow: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-300',
      icon: 'text-amber-300',
    },
  };

  const colors = colorClasses[themeColor];

  return (
    <>
      <button
        type="button"
        onClick={() => setIsPurchaseModalOpen(true)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${colors.bg} ${colors.border} ${className} hover:bg-amber-500/20 transition-colors`}
      >
        <Coins className={`h-4 w-4 ${colors.icon}`} />
        <span className={`text-sm font-semibold ${colors.text}`}>
          {isLoading ? '...' : `${balance} coins`}
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
