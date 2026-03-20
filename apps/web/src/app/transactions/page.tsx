'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { QUERY_KEYS, ROUTES } from '@/constants';
import { coinService } from '@/services/coin.service';
import type { TransactionFilter } from '@/types/coin.types';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@jyotish/ui';
import { Banknote, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

const TRANSACTION_FILTERS: { value: TransactionFilter | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'payment_success', label: 'Payment Success' },
  { value: 'admin_added', label: 'Admin Added' },
  { value: 'app_used', label: 'App Used Balance' },
];

function getReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    PAYMENT_SUCCESS: 'Payment',
    ADMIN_ADJUSTMENT: 'Admin Added',
    CHAT_ORDINARY: 'Chat',
    CHAT_PREMIUM: 'Chat (Premium)',
    PURCHASE: 'Purchase',
    REFUND: 'Refund',
    BROADCAST_MESSAGE: 'Broadcast',
  };
  return labels[reason] ?? reason.replace(/_/g, ' ');
}

function getDetailsLabel(item: { type: string; reason: string; amount: number }): string {
  if (item.type === 'ADD') {
    if (item.reason === 'PAYMENT_SUCCESS') return `Added Rs.${Math.abs(item.amount)}`;
    if (item.reason === 'ADMIN_ADJUSTMENT') return `Admin added Rs.${Math.abs(item.amount)}`;
    return `+${Math.abs(item.amount)} coins`;
  }
  return `-${Math.abs(item.amount)} coins used`;
}

function getStatusBadge(item: { type: string; reason: string }) {
  if (item.type === 'ADD') {
    if (item.reason === 'PAYMENT_SUCCESS') {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-200 border border-emerald-500/30">
          Success
        </Badge>
      );
    }
    if (item.reason === 'ADMIN_ADJUSTMENT') {
      return (
        <Badge className="bg-blue-500/15 text-blue-200 border border-blue-500/30">Admin Added</Badge>
      );
    }
  }
  return (
    <Badge className="bg-amber-500/15 text-amber-200 border border-amber-500/30">Deducted</Badge>
  );
}

export default function TransactionsPage() {
  const limit = 10;
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<TransactionFilter | ''>('');

  const params = useMemo(
    () => ({ page, limit, filter: filter || undefined }),
    [page, limit, filter]
  );

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.COINS.TRANSACTIONS(params),
    queryFn: () => coinService.getTransactionHistory(params),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });

  const transactions = data?.transactions ?? [];
  const pagination = data?.pagination ?? { page: 1, limit, total: 0, totalPages: 1 };

  const pages = useMemo(() => {
    const totalPages = pagination.totalPages ?? 1;
    const current = pagination.page ?? 1;
    const window = 2;
    const start = Math.max(1, current - window);
    const end = Math.min(totalPages, current + window);
    const out: number[] = [];
    for (let i = start; i <= end; i += 1) out.push(i);
    return out;
  }, [pagination.page, pagination.totalPages]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <Card className="bg-black/40 backdrop-blur-md border-white/10">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-white flex items-center gap-2">
                <Banknote className="h-5 w-5 text-purple-400" />
                Transactions History
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                {TRANSACTION_FILTERS.map((f) => (
                  <Button
                    key={f.value || 'all'}
                    variant={filter === f.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setFilter(f.value as TransactionFilter | '');
                      setPage(1);
                    }}
                    className={
                      filter === f.value
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'border-slate-600 text-slate-300 hover:bg-slate-800'
                    }
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-300">No transactions found.</p>
                <p className="text-sm text-gray-500 mt-1">
                  {filter
                    ? 'Try changing the filter to see more transactions.'
                    : 'Your payment and balance transactions will appear here.'}
                </p>
                <Button asChild variant="outline" className="mt-4">
                  <Link href={ROUTES.PRICING}>Top up Balance</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <Table className="bg-black/20">
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-purple-900/60 via-indigo-950/60 to-slate-900/60 hover:bg-gradient-to-r hover:from-purple-900/60 hover:via-indigo-950/60 hover:to-slate-900/60">
                        <TableHead className="text-slate-200 border-r border-slate-700/60 w-[72px]">
                          S.N.
                        </TableHead>
                        <TableHead className="text-slate-200 border-r border-slate-700/60 min-w-[140px]">
                          Transaction ID
                        </TableHead>
                        <TableHead className="text-slate-200 border-r border-slate-700/60">
                          Amount
                        </TableHead>
                        <TableHead className="text-slate-200 border-r border-slate-700/60">
                          Method
                        </TableHead>
                        <TableHead className="text-slate-200 border-r border-slate-700/60 min-w-[160px]">
                          Balance (Before → After)
                        </TableHead>
                        <TableHead className="text-slate-200 border-r border-slate-700/60 min-w-[220px]">
                          Details
                        </TableHead>
                        <TableHead className="text-slate-200 min-w-[190px]">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((t, idx) => {
                        const isAdd = t.type === 'ADD';
                        const details = getDetailsLabel(t);
                        return (
                          <TableRow key={t.id}>
                            <TableCell className="whitespace-nowrap border-r border-slate-700/40 text-slate-300">
                              {(pagination.page - 1) * pagination.limit + idx + 1}
                            </TableCell>
                            <TableCell className="whitespace-nowrap font-mono text-sm border-r border-slate-700/40 text-slate-300">
                              {t.transactionId ?? t.id.slice(0, 8)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap border-r border-slate-700/40 text-slate-200">
                              <div className="inline-flex items-center gap-2">
                                {isAdd ? (
                                  <ArrowUpCircle className="h-4 w-4 text-emerald-400" />
                                ) : (
                                  <ArrowDownCircle className="h-4 w-4 text-amber-400" />
                                )}
                                <span
                                  className={
                                    isAdd
                                      ? 'text-emerald-200 font-semibold'
                                      : 'text-amber-200 font-semibold'
                                  }
                                >
                                  {isAdd ? '+' : '-'}Rs {Math.abs(t.amount).toLocaleString()}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap border-r border-slate-700/40 text-slate-200">
                              {t.paymentMethod ?? getReasonLabel(t.reason)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap border-r border-slate-700/40 text-slate-300">
                              {Number(t.balanceBefore ?? 0).toLocaleString()} →{' '}
                              {Number(t.balanceAfter ?? 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="border-r border-slate-700/40 text-sm text-slate-200">
                              <div className="flex items-center gap-3">
                                {getStatusBadge(t)}
                                <span className="truncate" title={details}>
                                  {details}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-slate-200">
                              {t.createdAt
                                ? new Date(t.createdAt).toLocaleString()
                                : '-'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          disabled={(pagination.page ?? 1) <= 1}
                          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        />
                      </PaginationItem>

                      {pages.map((p) => (
                        <PaginationItem key={p}>
                          <PaginationLink
                            isActive={p === (pagination.page ?? 1)}
                            onClick={() => setPage(p)}
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          disabled={(pagination.page ?? 1) >= (pagination.totalPages ?? 1)}
                          onClick={() =>
                            setPage((prev) => Math.min(pagination.totalPages ?? 1, prev + 1))
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  <div className="text-sm text-slate-400 mt-2">
                    Showing page{' '}
                    <span className="text-slate-200 font-semibold">{pagination.page}</span> of{' '}
                    <span className="text-slate-200 font-semibold">{pagination.totalPages}</span> •{' '}
                    <span className="text-purple-300 font-semibold">{pagination.total}</span> total
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
