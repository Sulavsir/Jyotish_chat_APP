'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import { Button, Search, UsersIcon } from '@jyotish/ui';
import { RefreshCw } from 'lucide-react';
import { AdminTable, type AdminTableColumn } from '@/components/admin';
import { ADMIN_QUERY_KEYS } from '@/constants';
import type { User } from '@/types';

const ITEMS_PER_PAGE = 10;

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch users with TanStack Query
  const {
    data: rawUsers = [],
    isLoading,
    refetch,
  } = useQuery<User[]>({
    queryKey: ADMIN_QUERY_KEYS.USERS.LIST(),
    queryFn: async () => {
      const response: any = await adminApi.users.list();
      if (Array.isArray(response)) {
        return response;
      } else if (response?.users) {
        return response.users;
      }
      return [];
    },
  });

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

  // Filter users
  const filteredUsers = useMemo(() => {
    return rawUsers.filter(
      (user) =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm)
    );
  }, [rawUsers, searchTerm]);

  // Paginate users
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

  // Reset to page 1 when search term changes
  useMemo(() => {
    setCurrentPage(1);
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
      header: 'Actions',
      accessor: (user) => (
        <Button variant="outline" size="sm" onClick={() => toggleStatus(user.id)}>
          Toggle Status
        </Button>
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
            data={paginatedUsers}
            columns={columns}
            loading={isLoading}
            keyExtractor={(user) => user.id}
            currentPage={currentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={filteredUsers.length}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            emptyState={{
              icon: <UsersIcon className="w-20 h-20 text-slate-600" />,
              title: searchTerm ? 'No users found' : 'No users yet',
              description: searchTerm
                ? 'Try adjusting your search terms'
                : 'Users will appear here once they sign up on your platform',
            }}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
