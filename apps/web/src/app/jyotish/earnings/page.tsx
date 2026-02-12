/**
 * Jyotish My Earnings Page
 * Astrologer views coin earnings from chat/broadcast/appointment (commission-based)
 */

'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { JyotishLayout } from '@/components/layouts/JyotishLayout';
import { useRequireAuth } from '@/hooks';
import { USER_ROLES, QUERY_KEYS } from '@/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@jyotish/ui';
import { LoadingScreenWithBackground } from '@/components/ui';
import { getAstrologerEarnings } from '@/services/astrologerEarnings.service';
import type { AstrologerCoinEarningSource, AstrologerCoinEarningRow } from '@/types/earnings.types';
import { Coins, MessageSquare, Radio, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const SOURCE_LABELS: Record<AstrologerCoinEarningSource, string> = {
  CHAT_MESSAGE: 'Direct chat',
  BROADCAST_MESSAGE: 'Broadcast chat',
  APPOINTMENT: 'Appointment',
};

const SOURCE_ICONS: Record<AstrologerCoinEarningSource, React.ComponentType<{ className?: string }>> = {
  CHAT_MESSAGE: MessageSquare,
  BROADCAST_MESSAGE: Radio,
  APPOINTMENT: Calendar,
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function JyotishEarningsPage() {
  const { isCheckingAccess } = useRequireAuth({ requiredRole: USER_ROLES.ASTROLOGER });
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: QUERY_KEYS.JYOTISH_EARNINGS.LIST({ limit, offset: page * limit }),
    queryFn: () => getAstrologerEarnings({ limit, offset: page * limit }),
    staleTime: 60 * 1000,
  });

  const totalPages = useMemo(
    () => (data?.total != null ? Math.max(1, Math.ceil(data.total / limit)) : 1),
    [data?.total, limit]
  );
  const hasNext = page < totalPages - 1;
  const hasPrev = page > 0;

  if (isCheckingAccess) {
    return <LoadingScreenWithBackground message="Verifying access..." />;
  }

  return (
    <JyotishLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">My Earnings</h1>
          <p className="text-white/60 text-sm mt-1">
            Coins earned from client deductions (based on your commission %)
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-black/40 backdrop-blur-sm border border-white/[0.12] rounded-xl overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-white/80">Total earned</CardTitle>
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                <Coins className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white tracking-tight">
                {isLoading ? '—' : (data?.summary?.totalCoins ?? 0)} coins
              </div>
            </CardContent>
          </Card>
          {(Object.keys(SOURCE_LABELS) as AstrologerCoinEarningSource[]).map((source) => {
            const Icon = SOURCE_ICONS[source];
            const value = data?.summary?.bySource?.[source] ?? 0;
            return (
              <Card
                key={source}
                className="bg-black/40 backdrop-blur-sm border border-white/[0.12] rounded-xl overflow-hidden"
              >
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-white/80">
                    {SOURCE_LABELS[source]}
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-violet-500/20 text-violet-400">
                    <Icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-white tracking-tight">
                    {isLoading ? '—' : value} coins
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent earnings list */}
        <Card className="bg-black/40 backdrop-blur-sm border border-white/[0.12] rounded-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-white">Recent earnings</CardTitle>
            <p className="text-sm text-white/60">Per-message and per-session earnings</p>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="py-8 text-center text-white/60">Loading...</div>
            )}
            {isError && (
              <div className="py-8 text-center text-red-400">
                {error instanceof Error ? error.message : 'Failed to load earnings'}
              </div>
            )}
            {!isLoading && !isError && (!data?.items?.length ? (
              <div className="py-8 text-center text-white/60">
                No earnings yet. Earnings appear when clients spend coins in your chats or appointments.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-white/70">
                        <th className="pb-3 pr-4">Date</th>
                        <th className="pb-3 pr-4">Source</th>
                        <th className="pb-3 pr-4">Client coins</th>
                        <th className="pb-3 pr-4">Commission</th>
                        <th className="pb-3">You earned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.items ?? []).map((row: AstrologerCoinEarningRow) => {
                        const SourceIcon = SOURCE_ICONS[row.source];
                        return (
                          <tr
                            key={row.id}
                            className="border-b border-white/5 text-white/90"
                          >
                            <td className="py-3 pr-4 whitespace-nowrap text-white/70">
                              {formatDate(row.createdAt)}
                            </td>
                            <td className="py-3 pr-4">
                              <span className="inline-flex items-center gap-1.5">
                                <SourceIcon className="h-3.5 w-3.5 text-violet-400" />
                                {SOURCE_LABELS[row.source]}
                              </span>
                            </td>
                            <td className="py-3 pr-4">{row.clientCoinsDeducted}</td>
                            <td className="py-3 pr-4">{row.commissionPercent}%</td>
                            <td className="py-3 font-medium text-amber-400">
                              +{row.astrologerCoinsEarned} coins
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                    <span className="text-sm text-white/60">
                      Page {page + 1} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={!hasPrev}
                        className="p-2 rounded-lg border border-white/20 text-white/80 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={!hasNext}
                        className="p-2 rounded-lg border border-white/20 text-white/80 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ))}
          </CardContent>
        </Card>
      </div>
    </JyotishLayout>
  );
}
