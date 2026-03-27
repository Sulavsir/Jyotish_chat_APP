/**
 * Earnings metric in the dashboard stats grid (same slot as former “Total consultations”).
 * Today’s totals come from GET /astrologer/dashboard/stats (todaysEarnings); date filtering
 * and history use GET /astrologer/earnings?from=&to= on /jyotish/earnings.
 * Whole card links to My Earnings.
 */

'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@jyotish/ui';
import { Banknote } from 'lucide-react';
import { ROUTES } from '@/constants';
import type { JyotishDashboardStats } from '@/services/jyotishDashboard.service';
import type { AstrologerCoinEarningSource } from '@/types/earnings.types';

const SOURCE_LABELS: Record<AstrologerCoinEarningSource, string> = {
  CHAT_MESSAGE: 'Chat',
  BROADCAST_MESSAGE: 'Broadcast',
  APPOINTMENT: 'Appt.',
  KUNDALI_REVIEW: 'Kundali',
};

function formatNpr(amount: number): string {
  return new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export interface DashboardEarningsStatCardProps {
  earnings?: JyotishDashboardStats['todaysEarnings'];
  isLoading?: boolean;
  isError?: boolean;
}

export function DashboardEarningsStatCard({
  earnings,
  isLoading,
  isError,
}: DashboardEarningsStatCardProps) {
  const total = earnings?.amount ?? 0;
  const bySource = earnings?.bySource;
  const transactionCount = earnings?.transactionCount ?? 0;

  const subtitle = useMemo(() => {
    const parts: string[] = [];
    if (transactionCount > 0) {
      parts.push(`${transactionCount} transaction${transactionCount === 1 ? '' : 's'}`);
    }
    if (bySource) {
      const lines = (Object.entries(bySource) as [AstrologerCoinEarningSource, number][])
        .filter(([, n]) => n > 0)
        .map(([k, n]) => `${SOURCE_LABELS[k]} ${formatNpr(n)}`);
      if (lines.length) parts.push(lines.join(' · '));
    }
    return parts.length ? parts.join(' · ') : 'No activity today';
  }, [bySource, transactionCount]);

  return (
    <Link href={ROUTES.JYOTISH_EARNINGS} className="block h-full">
      <Card className="group bg-black/40 backdrop-blur-sm border border-white/[0.12] rounded-xl overflow-hidden hover:bg-black/50 hover:border-white/[0.18] transition-all duration-200 shadow-lg shadow-black/20 h-full flex flex-col cursor-pointer">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-white/80 leading-snug">
            Today&apos;s earnings
          </CardTitle>
          <div className="p-2 rounded-lg transition-colors bg-sky-500/20 text-sky-400 shrink-0">
            <Banknote className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col pt-0">
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-28 bg-white/15" />
              <Skeleton className="h-3 w-full max-w-[200px] bg-white/15 mt-2" />
            </>
          ) : isError ? (
            <>
              <div className="text-2xl font-bold text-white/50">—</div>
              <p className="text-xs text-red-400/85 mt-1">Could not load earnings</p>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-white tracking-tight">{formatNpr(total)}</div>
              <p className="text-xs text-white/60 mt-1 leading-relaxed line-clamp-3">{subtitle}</p>
            </>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
