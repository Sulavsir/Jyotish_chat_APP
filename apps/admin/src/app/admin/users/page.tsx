'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
} from '@jyotish/ui';
import { RefreshCw, Banknote, Plus } from 'lucide-react';
import { AdminTable, type AdminTableColumn } from '@/components/admin';
import { ADMIN_QUERY_KEYS, PAGINATION_DEFAULTS } from '@/constants';
import type { User } from '@/types';
import { AddCoinsModal } from '@/components/admin/AddCoinsModal';
import { generatePageNumbers } from '@/utils/helpers';

const ITEMS_PER_PAGE = PAGINATION_DEFAULTS.LIMIT;

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; balance?: number } | null>(null);
  const [showAddCoinsModal, setShowAddCoinsModal] = useState(false);

  // Fetch users with TanStack Query (server-side pagination)
  const {
    data: usersResponse,
    isLoading,
    refetch,
  } = useQuery<UsersResponse>({
    queryKey: [...ADMIN_QUERY_KEYS.USERS.LIST(), currentPage, searchTerm],
    queryFn: async () => {
      const response: any = await adminApi.users.list({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: searchTerm || undefined,
      });
      // Handle both response formats
      if (response?.users && response?.pagination) {
        return response;
      } else if (Array.isArray(response)) {
        // Fallback for old format
        return {
          users: response,
          pagination: {
            page: 1,
            limit: ITEMS_PER_PAGE,
            total: response.length,
            totalPages: 1,
          },
        };
      }
      return { users: [], pagination: { page: 1, limit: ITEMS_PER_PAGE, total: 0, totalPages: 0 } };
    },
  });

  const users = usersResponse?.users || [];
  const pagination = usersResponse?.pagination || {
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
  };

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => adminApi.users.toggleStatus(id),
    onSuccess: () => {
      toast.success('User status updated successfully');
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.USERS.ALL });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 'Failed to toggle status';
      toast.error(message);
    },
  });

  const toggleStatus = (id: string) => {
    toggleStatusMutation.mutate(id);
  };

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  }, [searchTerm]);

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">Users</h2>
            <p className="text-slate-400 mt-1">Manage your platform users</p>
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

        {/* Search Bar */}
        <Search
          placeholder="Search users by name, email, or phone..."
          value={searchTerm}
          onSearch={setSearchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Table */}
        <div className="cosmic-card rounded-xl overflow-hidden">
          <AdminTable
            data={users}
            columns={columns}
            loading={isLoading}
            keyExtractor={(user) => user.id}
            emptyState={{
              icon: <UsersIcon className="w-20 h-20 text-slate-600" />,
              title: searchTerm ? 'No users found' : 'No users yet',
              description: searchTerm
                ? 'Try adjusting your search terms'
                : 'Users will appear here once they sign up on your platform',
            }}
          />
        </div>

        {/* Pagination */}
        {!isLoading && pagination.totalPages > 0 && (
          <div className="rounded-xl p-4">
            <div className="flex flex-col gap-2 items-center justify-between">
              <div className="text-sm text-white font-medium">
                Showing <span className="text-purple-400">
                  {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
                </span> to{' '}
                <span className="text-purple-400">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span> of{' '}
                <span className="text-purple-400">{pagination.total}</span> entries
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
                      onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                      disabled={currentPage === pagination.totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}
      </div>

      {/* Add Balance Modal */}
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
