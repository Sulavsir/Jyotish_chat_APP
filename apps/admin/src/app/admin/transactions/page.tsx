'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import {
  Button,
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
import { Banknote, RefreshCw, CreditCard } from 'lucide-react';
import { ADMIN_QUERY_KEYS, PAGINATION_DEFAULTS } from '@/constants';
import { generatePageNumbers } from '@/utils/helpers';
import { PaymentMethodCell } from '@/components/transactions';
import type { AdminPaymentHistoryItem } from '@/types';

const ITEMS_PER_PAGE = PAGINATION_DEFAULTS.LIMIT;

export default function PaymentHistoryPage() {
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: response,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.PAYMENT_HISTORY.LIST({ page: currentPage, limit: ITEMS_PER_PAGE }),
    queryFn: () =>
      adminApi.paymentHistory.list({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      }),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });

  const transactions = response?.transactions ?? [];
  const pagination = response?.pagination ?? {
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 1,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">Payment History</h2>
            <p className="text-slate-400 mt-1">
              Successful payments only – GetPay, Fonepay QR, Fonepay Card
            </p>
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            disabled={isLoading || isFetching}
            className="border-slate-700 text-white hover:bg-slate-800"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="cosmic-card rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CreditCard className="w-16 h-16 text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No payments yet</h3>
              <p className="text-slate-400 max-w-sm">
                Successful payments will appear here once users start topping up their balance.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-800/80 hover:bg-slate-800/80">
                    <TableHead className="text-slate-200 border-slate-700/60">S.N.</TableHead>
                    <TableHead className="text-slate-200 border-slate-700/60">Transaction ID</TableHead>
                    <TableHead className="text-slate-200 border-slate-700/60">User</TableHead>
                    <TableHead className="text-slate-200 border-slate-700/60">Amount (NRs.)</TableHead>
                    <TableHead className="text-slate-200 border-slate-700/60">Payment Method</TableHead>
                    <TableHead className="text-slate-200 border-slate-700/60">Balance (Before → After)</TableHead>
                    <TableHead className="text-slate-200 border-slate-700/60">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx: AdminPaymentHistoryItem, idx: number) => (
                    <TableRow key={tx.id} className="border-slate-700/40">
                      <TableCell className="text-slate-300 whitespace-nowrap">
                        {(pagination.page - 1) * pagination.limit + idx + 1}
                      </TableCell>
                      <TableCell className="text-slate-300 whitespace-nowrap font-mono text-sm">
                        {tx.transactionId ?? '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-white">
                            {tx.user?.name || tx.user?.phone || 'Unknown'}
                          </span>
                          <span className="text-xs text-slate-400">
                            {tx.user?.email || tx.user?.phone}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Banknote className="h-4 w-4 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">
                            NRs {Number(tx.amount ?? 0).toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <PaymentMethodCell paymentMethod={tx.paymentMethod} />
                      </TableCell>
                      <TableCell className="text-slate-300 whitespace-nowrap">
                        {Number(tx.balanceBefore ?? 0).toLocaleString()} →{' '}
                        {Number(tx.balanceAfter ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-slate-300 whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {!isLoading && pagination.totalPages > 0 && (
          <div className="rounded-xl p-4">
            <div className="flex flex-col gap-2 items-center justify-between">
              <div className="text-sm text-white font-medium">
                Showing{' '}
                <span className="text-purple-400">
                  {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
                </span>{' '}
                to{' '}
                <span className="text-purple-400">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="text-purple-400">{pagination.total}</span> entries
              </div>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    />
                  </PaginationItem>

                  {generatePageNumbers(
                    currentPage,
                    pagination.totalPages,
                    PAGINATION_DEFAULTS.MAX_VISIBLE_PAGES
                  ).map((page, index) => (
                    <PaginationItem key={index}>
                      {typeof page === 'number' ? (
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      ) : (
                        <span className="px-2">…</span>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))
                      }
                      disabled={currentPage === pagination.totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
