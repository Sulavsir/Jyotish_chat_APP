'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useDebounce, useDebouncedPageSize } from '@/hooks';
import { toast } from 'sonner';
import { adminApi } from '@/lib/admin-api';
import { Button, Search, UsersIcon, AdminMonthRangeFilter, getAllTimeDateRange } from '@jyotish/ui';
import { Banknote, Plus } from 'lucide-react';
import {
  AdminTable,
  AdminClearFiltersButton,
  AdminListPaginationSection,
  AdminRefreshButton,
  type AdminTableColumn,
  ActiveStatusFilter,
  type ActiveFilterValue,
} from '@/components/admin';
import {
  ADMIN_QUERY_KEYS,
  PAGINATION_DEFAULTS,
  ADMIN_ROWS_PER_PAGE_OPTIONS,
  ADMIN_DATE_FILTER_DEBOUNCE_MS,
  ADMIN_SEARCH_DEBOUNCE_MS,
} from '@/constants';
import type { User } from '@/types';
import { AddCoinsModal } from '@/components/admin/AddCoinsModal';
import { useAdminStore } from '@/store/admin-store';
import { AdminRole } from '@jyotish/shared';

export default function UsersPage() {
  const isUserSupport = useAdminStore((s) => s.admin?.adminRole === AdminRole.USER_SUPPORT);
  const canAddBalance = !isUserSupport;
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm.trim(), ADMIN_SEARCH_DEBOUNCE_MS);
  const [currentPage, setCurrentPage] = useState(1);
  const {
    pageSize: rowsPerPage,
    setPageSize: setRowsPerPage,
    debouncedPageSize: debouncedRowsPerPage,
  } = useDebouncedPageSize(PAGINATION_DEFAULTS.LIMIT);
  const [statusFilter, setStatusFilter] = useState<ActiveFilterValue>('ALL');
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
    balance?: number;
  } | null>(null);
  const [showAddCoinsModal, setShowAddCoinsModal] = useState(false);
  const [joinedRange, setJoinedRange] = useState(getAllTimeDateRange);
  const debouncedJoinedFrom = useDebounce(joinedRange.from, ADMIN_DATE_FILTER_DEBOUNCE_MS);
  const debouncedJoinedTo = useDebounce(joinedRange.to, ADMIN_DATE_FILTER_DEBOUNCE_MS);

  useEffect(() => {
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  }, [debouncedSearch, debouncedJoinedFrom, debouncedJoinedTo, statusFilter, debouncedRowsPerPage]);

  const {
    data: usersResponse,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.USERS.LIST({
      page: currentPage,
      limit: debouncedRowsPerPage,
      search: debouncedSearch || undefined,
      isActive: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
      joinedFrom: debouncedJoinedFrom || undefined,
      joinedTo: debouncedJoinedTo || undefined,
    }),
    queryFn: () =>
      adminApi.users.list({
        page: currentPage,
        limit: debouncedRowsPerPage,
        search: debouncedSearch || undefined,
        isActive: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
        joinedFrom: debouncedJoinedFrom || undefined,
        joinedTo: debouncedJoinedTo || undefined,
      }),
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

  const handlePageSizeChange = (size: number) => {
    if (size === rowsPerPage) return;
    setRowsPerPage(size);
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  };

  const users = usersResponse?.users || [];
  const pagination = usersResponse?.pagination || {
    page: 1,
    limit: debouncedRowsPerPage,
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

  const allTime = getAllTimeDateRange();
  const isDefaultView =
    statusFilter === 'ALL' &&
    !debouncedSearch &&
    debouncedJoinedFrom === allTime.from &&
    debouncedJoinedTo === allTime.to;

  const hasUserFilters =
    Boolean(debouncedSearch) ||
    statusFilter !== 'ALL' ||
    debouncedJoinedFrom !== allTime.from ||
    debouncedJoinedTo !== allTime.to;

  const clearUserFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setJoinedRange(getAllTimeDateRange());
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  };

  const columns: AdminTableColumn<User>[] = useMemo(() => {
    const base: AdminTableColumn<User>[] = [
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
    ];

    if (!isUserSupport) {
      base.push({
        header: 'Total Balance Loaded (NRs)',
        accessor: (user) => (
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-blue-400" />
            <span className="text-blue-400 font-semibold">
              NRs {Number(user.totalBalanceLoaded ?? 0).toLocaleString()}
            </span>
          </div>
        ),
      });
    }

    base.push(
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
            {canAddBalance && (
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
            )}
            <Button variant="outline" size="sm" onClick={() => toggleStatus(user.id)}>
              Toggle Status
            </Button>
          </div>
        ),
        className: 'text-center',
      }
    );

    return base;
  }, [canAddBalance, isUserSupport]);

  return (
    <>
      <div className="space-y-5 sm:space-y-6">
        <div className="space-y-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="min-w-0 flex-1 pr-1 text-2xl sm:text-3xl font-bold text-white break-words">
              Users
            </h2>
            <div className="flex items-center gap-2 shrink-0 self-start flex-wrap justify-end">
              <AdminRefreshButton
                className="shrink-0"
                onClick={() => refetch()}
                loading={isLoading || isFetching}
              />
              <div className="hidden sm:block">
                <ActiveStatusFilter
                  value={statusFilter}
                  onChange={setStatusFilter}
                  disabled={isLoading || isFetching}
                />
              </div>
            </div>
          </div>
          <p className="text-sm sm:text-base text-slate-400">Manage your platform users</p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="sm:hidden w-full [&_button]:w-full [&_button]:justify-between">
            <ActiveStatusFilter
              value={statusFilter}
              onChange={setStatusFilter}
              disabled={isLoading || isFetching}
            />
          </div>
          <div className="flex w-full min-w-0 items-center gap-2 sm:gap-3 min-[1145px]:hidden">
            <div className="min-w-0 flex-1">
              <AdminMonthRangeFilter
                fromValue={joinedRange.from}
                toValue={joinedRange.to}
                onRangeChange={(from, to) => setJoinedRange({ from, to })}
                disabled={isLoading || isFetching}
                className="w-full min-w-0"
              />
            </div>
            <AdminClearFiltersButton
              show={hasUserFilters}
              onClear={clearUserFilters}
              disabled={isLoading || isFetching}
            />
          </div>
          <div className="flex w-full min-w-0 flex-row items-center gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <Search
                containerClassName="w-full"
                placeholder="Search users by name, email, or phone..."
                value={searchTerm}
                onSearch={(value) => {
                  setSearchTerm(value);
                  setCurrentPage(PAGINATION_DEFAULTS.PAGE);
                }}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="hidden min-[1145px]:block shrink-0">
              <AdminMonthRangeFilter
                fromValue={joinedRange.from}
                toValue={joinedRange.to}
                onRangeChange={(from, to) => setJoinedRange({ from, to })}
                disabled={isLoading || isFetching}
              />
            </div>
            <div className="hidden min-[1145px]:block shrink-0">
              <AdminClearFiltersButton
                show={hasUserFilters}
                onClear={clearUserFilters}
                disabled={isLoading || isFetching}
              />
            </div>
          </div>
        </div>

        <div className="cosmic-card rounded-xl overflow-hidden">
          <AdminTable
            data={users}
            columns={columns}
            loading={isLoading}
            keyExtractor={(user) => user.id}
            showSerialNumber
            currentPage={pagination.page}
            itemsPerPage={pagination.limit}
            emptyState={{
              icon: <UsersIcon className="w-16 h-16 text-slate-600" />,
              title: isDefaultView ? 'No users yet' : 'No users found',
              description: isDefaultView
                ? 'Users will appear here once they sign up on your platform'
                : 'Try adjusting search, status, or date joined filter.',
            }}
          />
        </div>

        {!isLoading && (
          <AdminListPaginationSection
            pagination={{
              page: pagination.page,
              limit: pagination.limit,
              total: pagination.total,
              totalPages: pagination.totalPages,
            }}
            onPageChange={setCurrentPage}
            pageSize={rowsPerPage}
            pageSizeOptions={ADMIN_ROWS_PER_PAGE_OPTIONS}
            onPageSizeChange={handlePageSizeChange}
            disabled={isFetching}
          />
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
    </>
  );
}
