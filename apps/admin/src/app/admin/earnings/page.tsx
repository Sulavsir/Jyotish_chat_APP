'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import { Button, Search, MoneyIcon } from '@jyotish/ui';
import { RefreshCw } from 'lucide-react';
import { AdminTable, type AdminTableColumn } from '@/components/admin';
import { ADMIN_QUERY_KEYS } from '@/constants';
import type { Earning } from '@/types';

export default function EarningsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch earnings with TanStack Query
  const { data: rawEarnings = [], isLoading, refetch } = useQuery<Earning[]>({
    queryKey: ADMIN_QUERY_KEYS.EARNINGS.LIST(),
    queryFn: async () => {
      const response: any = await adminApi.earnings.list();
      if (Array.isArray(response)) {
        return response;
      } else if (response?.earnings) {
        return response.earnings;
      }
      return [];
    },
  });

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'PAID':
        return 'bg-green-500/20 text-green-400';
      case 'PROCESSING':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  // Filter earnings
  const filteredEarnings = useMemo(() => {
    return rawEarnings.filter(
      (earning) =>
        earning.astrologer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        earning.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rawEarnings, searchTerm]);

  const columns: AdminTableColumn<Earning>[] = [
    {
      header: 'Astrologer',
      accessor: (earning) => <span className="font-medium">{earning.astrologer.name}</span>,
    },
    {
      header: 'Amount',
      accessor: (earning) => <span>₹{earning.amount.toFixed(2)}</span>,
    },
    {
      header: 'Commission',
      accessor: (earning) => (
        <span className="text-red-400">-₹{earning.commission.toFixed(2)}</span>
      ),
    },
    {
      header: 'Net Earning',
      accessor: (earning) => (
        <span className="text-green-400 font-semibold">₹{earning.netEarning.toFixed(2)}</span>
      ),
    },
    {
      header: 'Status',
      accessor: (earning) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(earning.status)}`}
        >
          {earning.status}
        </span>
      ),
    },
    {
      header: 'Date',
      accessor: (earning) => (
        <span className="text-sm text-slate-400">
          {new Date(earning.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">Earnings Management</h2>
            <p className="text-slate-400 mt-1">Manage astrologer earnings and payouts</p>
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
          placeholder="Search by astrologer name or status..."
          value={searchTerm}
          onSearch={setSearchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Table */}
        <div className="cosmic-card rounded-xl overflow-hidden">
          <AdminTable
            data={filteredEarnings}
            columns={columns}
            loading={isLoading}
            keyExtractor={(earning) => earning.id}
            emptyState={{
              icon: <MoneyIcon className="w-20 h-20 text-slate-600" />,
              title: searchTerm ? 'No earnings found' : 'No earnings records',
              description: searchTerm
                ? 'Try adjusting your search terms'
                : 'Earning records will appear here as consultations are completed',
            }}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
