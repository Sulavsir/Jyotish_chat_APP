/**
 * Coin Transactions Page
 * Shows user's coin transaction history
 */

'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@jyotish/ui';
import { Coins, ArrowUpCircle, ArrowDownCircle, Calendar, Loader2 } from 'lucide-react';
import { coinService } from '@/services/coin.service';
import { QUERY_KEYS, ROUTES } from '@/constants';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types/user.types';
import { useAuthStore } from '@/store/auth-store';

interface CoinTransaction {
  id: string;
  userId: string;
  amount: number;
  type: string;
  reason: string;
  balanceBefore: number;
  balanceAfter: number;
  chatId?: string;
  paymentId?: string;
  adminId?: string;
  createdAt: Date;
}

export default function CoinTransactionsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.COINS.TRANSACTION_HISTORY,
    queryFn: () => coinService.getTransactionHistory({ limit: 100 }),
    enabled: user?.role === UserRole.CLIENT,
  });

  const transactions = data?.transactions || [];
  const total = data?.total || 0;

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      CHAT_ORDINARY: 'Chat (Ordinary)',
      CHAT_PREMIUM: 'Chat (Premium)',
      PURCHASE: 'Purchase',
      REFUND: 'Refund',
      ADMIN_ADJUSTMENT: 'Admin Adjustment',
      PAYMENT_SUCCESS: 'Payment',
    };
    return labels[reason] || reason;
  };

  if (user?.role !== UserRole.CLIENT) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-red-400">This page is only available for clients.</p>
          <Button onClick={() => router.push(ROUTES.DASHBOARD)} className="mt-4">
            Go to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Coin Transactions</h1>
            <p className="text-purple-200/80">View your coin transaction history</p>
          </div>
          <Button
            onClick={() => router.push(ROUTES.PRICING)}
            className="bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white"
          >
            <Coins className="h-4 w-4 mr-2" />
            Buy Coins
          </Button>
        </div>

        <Card className="bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 border border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white">Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <Coins className="h-16 w-16 text-purple-400/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Transactions Yet</h3>
                <p className="text-purple-200/80 mb-6">
                  Your coin transactions will appear here once you start using coins.
                </p>
                <Button
                  onClick={() => router.push(ROUTES.PRICING)}
                  className="bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white"
                >
                  Buy Coins
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => {
                  const isAdd = transaction.type === 'ADD';
                  return (
                    <div
                      key={transaction.id}
                      className="p-4 bg-slate-800/50 border border-purple-500/20 rounded-lg hover:border-purple-500/40 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div
                            className={`p-2 rounded-lg ${
                              isAdd
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {isAdd ? (
                              <ArrowUpCircle className="h-5 w-5" />
                            ) : (
                              <ArrowDownCircle className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`font-semibold ${
                                  isAdd ? 'text-green-400' : 'text-red-400'
                                }`}
                              >
                                {isAdd ? '+' : '-'}
                                {Math.abs(transaction.amount)} coins
                              </span>
                              <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded">
                                {getReasonLabel(transaction.reason)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-purple-200/70">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(transaction.createdAt)}
                              </span>
                              <span>
                                Balance: {transaction.balanceBefore} → {transaction.balanceAfter}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
