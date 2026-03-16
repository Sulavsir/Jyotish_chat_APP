'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import {
  Button,
  Search,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@jyotish/ui';
import { Banknote, RefreshCw, UsersIcon } from 'lucide-react';
import { AdminTable, type AdminTableColumn } from '@/components/admin';
import { ADMIN_QUERY_KEYS, PAGINATION_DEFAULTS } from '@/constants';
import { generatePageNumbers } from '@/utils/helpers';

interface TransactionUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string;
}

interface CoinTransactionRow {
  id: string;
  userId: string;
  amount: number;
  type: 'DEDUCT' | 'ADD' | 'REFUND';
  reason: string;
  balanceBefore: number;
  balanceAfter: number;
  chatId?: string | null;
  paymentId?: string | null;
  adminId?: string | null;
  createdAt: string;
  user?: TransactionUser | null;
}

interface TransactionsResponse {
  transactions: CoinTransactionRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const ITEMS_PER_PAGE = PAGINATION_DEFAULTS.LIMIT;

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: transactionsResponse,
    isLoading,
    refetch,
  } = useQuery<TransactionsResponse>({
    queryKey: [...ADMIN_QUERY_KEYS.EARNINGS.LIST(), 'transactions', currentPage, searchTerm],
    queryFn: async () => {
      const response = await adminApi.transactions.list({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      });

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const filtered = response.transactions.filter((tx) => {
          const u = tx.user;
          return (
            tx.id.toLowerCase().includes(term) ||
            (u?.name && u.name.toLowerCase().includes(term)) ||
            (u?.email && u.email.toLowerCase().includes(term)) ||
            (u?.phone && u.phone.toLowerCase().includes(term))
          );
        });
        return {
          transactions: filtered,
          pagination: response.pagination,
        };
      }

      return response;
    },
  });

  const transactions = transactionsResponse?.transactions ?? [];
  const pagination = transactionsResponse?.pagination ?? {
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
  };

  const columns: AdminTableColumn<CoinTransactionRow>[] = [
    {
      header: 'User',
      accessor: (tx) => (
        <div className="flex flex-col">
          <span className="font-medium text-white">
            {tx.user?.name || tx.user?.phone || 'Unknown'}
          </span>
          <span className="text-xs text-slate-400">{tx.user?.email || tx.user?.phone}</span>
        </div>
      ),
    },
    {
      header: 'Amount (NRs)',
      accessor: (tx) => (
        <div className="flex items-center gap-2">
          <Banknote className="h-4 w-4 text-emerald-400" />
          <span className="text-emerald-400 font-semibold">
            NRs {Number(tx.amount ?? 0).toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: (tx) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            tx.type === 'ADD'
              ? 'bg-emerald-500/20 text-emerald-300'
              : tx.type === 'DEDUCT'
                ? 'bg-red-500/20 text-red-300'
                : 'bg-yellow-500/20 text-yellow-300'
          }`}
        >
          {tx.type}
        </span>
      ),
    },
    {
      header: 'Reason',
      accessor: (tx) => <span className="text-slate-200 text-sm">{tx.reason}</span>,
    },
    {
      header: 'Balance (Before → After)',
      accessor: (tx) => (
        <div className="text-xs text-slate-300">
          <span className="line-through mr-1">
            NRs {Number(tx.balanceBefore ?? 0).toLocaleString()}
          </span>
          <span>→</span>{' '}
          <span className="font-semibold">
            NRs {Number(tx.balanceAfter ?? 0).toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      header: 'Date',
      accessor: (tx) => (
        <span className="text-xs text-slate-300">
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
            <h2 className="text-3xl font-bold text-white">Balance Transactions</h2>
            <p className="text-slate-400 mt-1">
              View all user balance transactions across the platform
            </p>
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="border-slate-700 text-white hover:bg-slate-800"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Search
          placeholder="Search by user name, email, phone, or transaction ID..."
          value={searchTerm}
          onSearch={setSearchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="cosmic-card rounded-xl overflow-hidden">
          <AdminTable
            data={transactions}
            columns={columns}
            loading={isLoading}
            keyExtractor={(tx) => tx.id}
            emptyState={{
              icon: <UsersIcon className="w-20 h-20 text-slate-600" />,
              title: searchTerm ? 'No transactions found' : 'No transactions yet',
              description: searchTerm
                ? 'Try adjusting your search terms'
                : 'Transactions will appear here once users start using the platform',
            }}
          />
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
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
                        <PaginationEllipsis />
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))
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

