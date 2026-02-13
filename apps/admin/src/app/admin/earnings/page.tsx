'use client';

import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import {
  Button,
  Search,
  MoneyIcon,
  StarIcon,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@jyotish/ui';
import { RefreshCw } from 'lucide-react';
import { AdminTable, type AdminTableColumn } from '@/components/admin';
import { ADMIN_QUERY_KEYS, PAGINATION_DEFAULTS } from '@/constants';
import type { AstrologerWithCoinEarning } from '@/types';
import { generatePageNumbers } from '@/utils/helpers';
import { AstrologerCategory } from '@jyotish/shared';

const ITEMS_PER_PAGE = PAGINATION_DEFAULTS.LIMIT;

export default function EarningsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.EARNINGS.ASTROLOGERS_WITH_COINS({
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      search: searchTerm || undefined,
    }),
    queryFn: () =>
      adminApi.earnings.listAstrologersWithCoins({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: searchTerm || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const astrologers = data?.astrologers ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
  };

  const columns: AdminTableColumn<AstrologerWithCoinEarning>[] = [
    {
      header: 'Name',
      accessor: (row) => <span className="font-medium text-white">{row.name}</span>,
    },
    {
      header: 'Email',
      accessor: (row) => (
        <span className="text-slate-300">{row.email ?? '—'}</span>
      ),
    },
    {
      header: 'Phone',
      accessor: (row) => <span className="text-slate-300">{row.phone}</span>,
    },
    {
      header: 'Category',
      accessor: (row) => {
        const category = row.category as AstrologerCategory;
        const isPremium = category === AstrologerCategory.PREMIUM;
        const isProfessional = category === AstrologerCategory.PROFESSIONAL;
        const isKathaVachak = category === AstrologerCategory.KATHA_VACHAK;
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${
              isPremium
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : isProfessional
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
            }`}
          >
            {isPremium ? (
              <>👑 Premium</>
            ) : isProfessional ? (
              <>💎 Professional</>
            ) : isKathaVachak ? (
              <>📖 Katha Vachak</>
            ) : (
              <>⭐ Ordinary</>
            )}
          </span>
        );
      },
    },
    {
      header: 'Rating',
      accessor: (row) => (
        <div className="flex items-center gap-1">
          <StarIcon className="w-4 h-4 text-orange-400 shrink-0" />
          <span className="text-slate-300">
            {row.rating != null ? row.rating.toFixed(1) : '—'}
          </span>
        </div>
      ),
    },
    {
      header: 'Earning (coins)',
      accessor: (row) => (
        <span className="font-semibold text-yellow-400">{row.totalCoinEarnings} coins</span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">Earnings</h2>
            <p className="text-slate-400 mt-1">
              Astrologer list with coin earnings (from chat, broadcast, appointment)
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
          placeholder="Search by name, email or phone..."
          value={searchTerm}
          onSearch={(value) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="cosmic-card rounded-xl overflow-hidden">
          <AdminTable
            data={astrologers}
            columns={columns}
            loading={isLoading}
            keyExtractor={(row) => row.id}
            emptyState={{
              icon: <MoneyIcon className="w-20 h-20 text-slate-600" />,
              title: searchTerm ? 'No astrologers found' : 'No astrologers',
              description: searchTerm
                ? 'Try adjusting your search'
                : 'Astrologer coin earnings will appear here',
            }}
          />
        </div>

        {/* Pagination - same as other admin tables */}
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
