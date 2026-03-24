'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useDebounce } from '@/hooks';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import {
  Button,
  Search,
  UsersIcon,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  AdminMonthRangeFilter,
  AdminPaginationBar,
  getTodayDateRange,
} from '@jyotish/ui';
import { RefreshCw, Banknote, Plus } from 'lucide-react';
import {
  AdminTable,
  AdminClearFiltersButton,
  type AdminTableColumn,
  ActiveStatusFilter,
  type ActiveFilterValue,
} from '@/components/admin';
import {
  ADMIN_QUERY_KEYS,
  PAGINATION_DEFAULTS,
  ADMIN_DATE_FILTER_DEBOUNCE_MS,
  ADMIN_SEARCH_DEBOUNCE_MS,
} from '@/constants';
import type { User } from '@/types';
import { AddCoinsModal } from '@/components/admin/AddCoinsModal';
import { generatePageNumbers } from '@/utils/helpers';
import { LoadingButton } from '@/components/ui/LoadingButton';

const DEFAULT_ITEMS_PER_PAGE = PAGINATION_DEFAULTS.LIMIT;
const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm.trim(), ADMIN_SEARCH_DEBOUNCE_MS);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(DEFAULT_ITEMS_PER_PAGE);
  const [statusFilter, setStatusFilter] = useState<ActiveFilterValue>('ALL');
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
    balance?: number;
  } | null>(null);
  const [showAddCoinsModal, setShowAddCoinsModal] = useState(false);
  const [joinedRange, setJoinedRange] = useState(getTodayDateRange);
  const debouncedJoinedFrom = useDebounce(joinedRange.from, ADMIN_DATE_FILTER_DEBOUNCE_MS);
  const debouncedJoinedTo = useDebounce(joinedRange.to, ADMIN_DATE_FILTER_DEBOUNCE_MS);

  useEffect(() => {
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  }, [debouncedSearch, debouncedJoinedFrom, debouncedJoinedTo]);

  const {
    data: usersResponse,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.USERS.LIST({
      page: currentPage,
      limit: rowsPerPage,
      search: debouncedSearch || undefined,
      isActive: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
      joinedFrom: debouncedJoinedFrom || undefined,
      joinedTo: debouncedJoinedTo || undefined,
    }),
    queryFn: () =>
      adminApi.users.list({
        page: currentPage,
        limit: rowsPerPage,
        search: debouncedSearch || undefined,
        isActive: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
        joinedFrom: debouncedJoinedFrom || undefined,
        joinedTo: debouncedJoinedTo || undefined,
      }),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

  const users = usersResponse?.users || [];
  const pagination = usersResponse?.pagination || {
    page: 1,
    limit: rowsPerPage,
    total: 0,
    totalPages: 0,
  };

  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => adminApi.users.toggleStatus(id),
    onSuccess: () => {
      toast.success('User status updated successfully');
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.USERS.ALL });
    },
    onError: (error: unknown) => {
      const message = isAxiosError(error)
        ? (error.response?.data as { error?: { message?: string } })?.error?.message
        : undefined;
      toast.error(message ?? 'Failed to toggle status');
    },
  });

  const toggleStatus = (id: string) => {
    toggleStatusMutation.mutate(id);
  };

  const today = getTodayDateRange();
  const isDefaultView =
    statusFilter === 'ALL' &&
    !debouncedSearch &&
    debouncedJoinedFrom === today.from &&
    debouncedJoinedTo === today.to;

  const clearUserFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setJoinedRange(getTodayDateRange());
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  };

  useEffect(() => {
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  }, [statusFilter, rowsPerPage]);

  const columns: AdminTableColumn<User>[] = [
    {
      header: 'Name',
      accessor: (user) => <span className="font-medium">{user.name || 'N/A'}</span>,
    },
    {
      header: 'Email',
      accessor: (user) => user.email || 'N/A',
    },
    {
      header: 'Phone',
      accessor: (user) => user.phone,
    },
    {
      header: 'Profile',
      accessor: (user) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            user.profileCompleted
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-yellow-500/20 text-yellow-400'
          }`}
        >
          {user.profileCompleted ? 'Complete' : 'Incomplete'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (user) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            user.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}
        >
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Balance (NRs)',
      accessor: (user) => (
        <div className="flex items-center gap-2">
          <Banknote className="h-4 w-4 text-emerald-400" />
          <span className="text-emerald-400 font-semibold">
            NRs {Number(user.coins ?? 0).toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      header: 'Total Balance Loaded (NRs)',
      accessor: (user) => (
        <div className="flex items-center gap-2">
          <Banknote className="h-4 w-4 text-blue-400" />
          <span className="text-blue-400 font-semibold">
            NRs {Number(user.totalBalanceLoaded ?? 0).toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      header: 'Date Joined',
      accessor: (user) => (
        <span className="text-slate-300 text-sm">
          {user.createdAt ? new Date(user.createdAt).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (user) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedUser({ id: user.id, name: user.name || 'User', balance: user.coins });
              setShowAddCoinsModal(true);
            }}
            className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Balance
          </Button>
          <Button variant="outline" size="sm" onClick={() => toggleStatus(user.id)}>
            Toggle Status
          </Button>
        </div>
      ),
      className: 'text-center',
    },
  ];

  const showingFrom =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const showingTo = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">Users</h2>
            <p className="text-slate-400 mt-1">Manage your platform users</p>
          </div>
          <div className="flex items-center gap-2">
            <ActiveStatusFilter
              value={statusFilter}
              onChange={setStatusFilter}
              disabled={isLoading || isFetching}
            />
            <LoadingButton
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              isLoading={isLoading || isFetching}
              loadingText="Refreshing"
              className="border-slate-700 text-white hover:bg-slate-800"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </LoadingButton>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:gap-4">
          <div className="min-w-0 flex-1">
            <Search
              placeholder="Search users by name, email, or phone..."
              value={searchTerm}
              onSearch={setSearchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <AdminMonthRangeFilter
            fromValue={joinedRange.from}
            toValue={joinedRange.to}
            onRangeChange={(from, to) => setJoinedRange({ from, to })}
            disabled={isLoading || isFetching}
          />
          <AdminClearFiltersButton
            show={!isDefaultView}
            onClear={clearUserFilters}
            disabled={isLoading || isFetching}
          />
        </div>

        <div className="cosmic-card rounded-xl overflow-hidden">
          <AdminTable
            data={users}
            columns={columns}
            loading={isLoading}
            keyExtractor={(user) => user.id}
            emptyState={{
              icon: <UsersIcon className="w-20 h-20 text-slate-600" />,
              title: isDefaultView ? 'No users yet' : 'No users found',
              description: isDefaultView
                ? 'Users will appear here once they sign up on your platform'
                : 'Try adjusting search, status, or date joined filter.',
            }}
          />
        </div>

        {!isLoading && (
          <div className="rounded-xl p-4">
            <AdminPaginationBar
              showingFrom={showingFrom}
              showingTo={showingTo}
              totalItems={pagination.total}
              pageSize={rowsPerPage}
              pageSizeOptions={ROWS_PER_PAGE_OPTIONS}
              onPageSizeChange={setRowsPerPage}
              disabled={isFetching}
              pagination={
                pagination.totalPages > 0 ? (
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
                ) : null
              }
            />
          </div>
        )}
      </div>

      {selectedUser && (
        <AddCoinsModal
          isOpen={showAddCoinsModal}
          onClose={() => {
            setShowAddCoinsModal(false);
            setSelectedUser(null);
          }}
          userId={selectedUser.id}
          userName={selectedUser.name}
          currentBalance={selectedUser.balance}
        />
      )}
    </AdminLayout>
  );
}
