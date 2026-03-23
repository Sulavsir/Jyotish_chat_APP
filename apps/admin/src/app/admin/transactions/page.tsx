'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import { Button } from '@jyotish/ui';
import { RefreshCw, CreditCard, Banknote } from 'lucide-react';
import { ADMIN_QUERY_KEYS, PAGINATION_DEFAULTS } from '@/constants';
import { AdminTable, type AdminTableColumn } from '@/components/admin';
import { PaymentMethodCell, TransactionIdCell } from '@/components/transactions';
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

  const columns: AdminTableColumn<AdminPaymentHistoryItem>[] = [
    {
      header: 'Transaction ID',
      accessor: (tx) => (
        <TransactionIdCell
          transactionId={tx.transactionId}
          fallback={tx.paymentId ?? tx.id.slice(0, 8)}
        />
      ),
      className: 'min-w-[140px]',
    },
    {
      header: 'User',
      accessor: (tx) => (
        <div className="flex flex-col">
          <span className="font-medium text-white">
            {tx.user?.name || tx.user?.phone || 'Unknown'}
          </span>
          <span className="text-xs text-slate-400">
            {tx.user?.email || tx.user?.phone}
          </span>
        </div>
      ),
      className: 'min-w-[160px]',
    },
    {
      header: 'Amount (NRs.)',
      accessor: (tx) => (
        <div className="flex items-center gap-2">
          <Banknote className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="text-emerald-400 font-semibold">
            NRs {Number(tx.amount ?? 0).toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      header: 'Payment Method',
      accessor: (tx) => <PaymentMethodCell paymentMethod={tx.paymentMethod} />,
    },
    {
      header: 'Balance (Before → After)',
      accessor: (tx) => (
        <span className="text-slate-300">
          {Number(tx.balanceBefore ?? 0).toLocaleString()} →{' '}
          {Number(tx.balanceAfter ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Date',
      accessor: (tx) => (
        <span className="text-slate-300">
          {new Date(tx.createdAt).toLocaleString()}
        </span>
      ),
    },
  ];

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
          <AdminTable
            data={transactions}
            columns={columns}
            loading={isLoading}
            keyExtractor={(tx) => tx.id}
            showSerialNumber
            currentPage={pagination.page}
            itemsPerPage={pagination.limit}
            totalItems={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={setCurrentPage}
            emptyState={{
              icon: <CreditCard className="w-16 h-16 text-slate-600" />,
              title: 'No payments yet',
              description:
                'Successful payments will appear here once users start topping up their balance.',
            }}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
