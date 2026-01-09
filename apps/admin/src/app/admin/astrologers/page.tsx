'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import { Button, Search, PlusIcon, StarIcon } from '@jyotish/ui';
import { RefreshCw } from 'lucide-react';
import { AdminTable, type AdminTableColumn } from '@/components/admin';
import { ADMIN_ROUTES, ADMIN_QUERY_KEYS } from '@/constants';
import { useAdminSocket } from '@/hooks';
import type { Astrologer } from '@/types';
import { AstrologerCategory } from '@jyotish/shared';

const ITEMS_PER_PAGE = 10;

export default function AstrologersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { on, off, isConnected } = useAdminSocket();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [onlineAstrologers, setOnlineAstrologers] = useState<Set<string>>(new Set());

  // Debug: Log socket connection status
  useEffect(() => {
    console.log('📊 [ADMIN ASTROLOGERS] Socket connection status:', {
      isConnected,
      hasOn: !!on,
      hasOff: !!off,
    });
  }, [isConnected, on, off]);

  // Fetch astrologers with TanStack Query
  const {
    data: rawAstrologers = [],
    isLoading,
    refetch,
  } = useQuery<Astrologer[]>({
    queryKey: ADMIN_QUERY_KEYS.ASTROLOGERS.LIST(),
    queryFn: async () => {
      const response: any = await adminApi.astrologers.list();
      if (Array.isArray(response)) {
        return response;
      } else if (response?.astrologers) {
        return response.astrologers;
      }
      return [];
    },
  });

  // Listen for real-time astrologer online status updates
  useEffect(() => {
    if (!on || !off) {
      console.warn('⚠️ Admin socket on/off functions not available');
      return;
    }

    console.log('✅ Setting up astrologer:status_changed listener', { isConnected });

    const handleAstrologerStatusChanged = (data: { astrologerId: string; isOnline: boolean }) => {
      console.log('🔔 [ADMIN] Astrologer status changed received:', data);
      setOnlineAstrologers((prev) => {
        const newSet = new Set(prev);
        if (data.isOnline) {
          newSet.add(data.astrologerId);
          console.log(`✅ Added ${data.astrologerId} to online set. Total online: ${newSet.size}`);
        } else {
          newSet.delete(data.astrologerId);
          console.log(
            `❌ Removed ${data.astrologerId} from online set. Total online: ${newSet.size}`
          );
        }
        return newSet;
      });
    };

    on('astrologer:status_changed', handleAstrologerStatusChanged);
    console.log('📡 Admin socket listener registered for astrologer:status_changed');

    return () => {
      console.log('🔌 Removing astrologer:status_changed listener');
      off('astrologer:status_changed', handleAstrologerStatusChanged);
    };
  }, [on, off, isConnected]);

  // Initialize online status from database
  useEffect(() => {
    if (rawAstrologers.length > 0) {
      const online = new Set(rawAstrologers.filter((a) => a.isOnline).map((a) => a.id));
      setOnlineAstrologers(online);
    }
  }, [rawAstrologers]);

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => adminApi.astrologers.toggleStatus(id),
    onSuccess: () => {
      toast.success('Astrologer status updated successfully');
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.ASTROLOGERS.ALL });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 'Failed to toggle status';
      toast.error(message);
    },
  });

  const toggleStatus = (id: string) => {
    toggleStatusMutation.mutate(id);
  };

  // Filter astrologers
  const filteredAstrologers = useMemo(() => {
    return rawAstrologers.filter(
      (astro) =>
        astro.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        astro.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        astro.phone?.includes(searchTerm)
    );
  }, [rawAstrologers, searchTerm]);

  // Paginate astrologers
  const paginatedAstrologers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAstrologers.slice(startIndex, endIndex);
  }, [filteredAstrologers, currentPage]);

  const totalPages = Math.ceil(filteredAstrologers.length / ITEMS_PER_PAGE);

  // Reset to page 1 when search term changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const columns: AdminTableColumn<Astrologer>[] = [
    {
      header: 'Name',
      accessor: (astrologer) => <span className="font-medium">{astrologer.name}</span>,
    },
    {
      header: 'Email',
      accessor: (astrologer) => astrologer.email,
    },
    {
      header: 'Phone',
      accessor: (astrologer) => astrologer.phone,
    },
    {
      header: 'Experience',
      accessor: (astrologer) => `${astrologer.experience} years`,
    },
    {
      header: 'Category',
      accessor: (astrologer) => (
        <span
          className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
            astrologer.category === AstrologerCategory.PREMIUM
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : astrologer.category === AstrologerCategory.PROFESSIONAL
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
          }`}
        >
          {astrologer.category === AstrologerCategory.PREMIUM
            ? '👑 Premium'
            : astrologer.category === AstrologerCategory.PROFESSIONAL
              ? '💎 Professional'
              : '⭐ Ordinary'}
        </span>
      ),
    },
    {
      header: 'Rating',
      accessor: (astrologer) => (
        <div className="flex items-center gap-1">
          <StarIcon className="w-4 h-4 text-yellow-500" />
          {astrologer.rating.toFixed(1)}
        </div>
      ),
    },
    {
      header: 'Account Status',
      accessor: (astrologer) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            astrologer.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}
        >
          {astrologer.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Online Status',
      accessor: (astrologer) => {
        const isOnline = onlineAstrologers.has(astrologer.id);
        return (
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}
            />
            <span
              className={`text-xs font-medium ${isOnline ? 'text-green-400' : 'text-slate-500'}`}
            >
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Actions',
      accessor: (astrologer) => (
        <Button variant="outline" size="sm" onClick={() => toggleStatus(astrologer.id)}>
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
            <h2 className="text-3xl font-bold text-white">Astrologers</h2>
            <p className="text-slate-400 mt-1">Manage your cosmic advisors</p>
          </div>
          <div className="flex items-center gap-2">
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
            <Button
              onClick={() => router.push(ADMIN_ROUTES.ASTROLOGERS_CREATE)}
              className="flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Add Astrologer
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <Search
          placeholder="Search astrologers by name, email, or phone..."
          value={searchTerm}
          onSearch={setSearchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Table */}
        <div className="cosmic-card rounded-xl overflow-hidden">
          <AdminTable
            data={paginatedAstrologers}
            columns={columns}
            loading={isLoading}
            keyExtractor={(astrologer) => astrologer.id}
            currentPage={currentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={filteredAstrologers.length}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            emptyState={{
              icon: <StarIcon className="w-20 h-20 text-slate-600" />,
              title: searchTerm ? 'No astrologers found' : 'No astrologers yet',
              description: searchTerm
                ? 'Try adjusting your search terms'
                : 'Get started by adding your first astrologer to the platform',
              action: {
                label: 'Add Astrologer',
                onClick: () => router.push(ADMIN_ROUTES.ASTROLOGERS_CREATE),
              },
            }}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
