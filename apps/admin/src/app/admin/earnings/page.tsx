'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import { Search } from '@jyotish/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
  EmptyState,
  MoneyIcon,
} from '@jyotish/ui';
import type { Earning } from '@/types';

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const response: any = await adminApi.earnings.list();
      if (Array.isArray(response)) {
        setEarnings(response);
      } else if (response?.earnings) {
        setEarnings(response.earnings);
      }
    } catch (error) {
      console.error('Failed to load earnings:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredEarnings = earnings.filter(
    (earning) =>
      earning.astrologer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      earning.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-white">Earnings Management</h2>
          <p className="text-slate-400 mt-1">Manage astrologer earnings and payouts</p>
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
          {loading ? (
            <TableSkeleton rows={10} columns={6} />
          ) : filteredEarnings.length === 0 ? (
            <EmptyState
              icon={<MoneyIcon className="w-20 h-20 text-slate-600" />}
              title={searchTerm ? 'No earnings found' : 'No earnings records'}
              description={
                searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Earning records will appear here as consultations are completed'
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Astrologer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Net Earning</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEarnings.map((earning) => (
                  <TableRow key={earning.id}>
                    <TableCell className="font-medium">{earning.astrologer.name}</TableCell>
                    <TableCell>₹{earning.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-red-400">-₹{earning.commission.toFixed(2)}</TableCell>
                    <TableCell className="text-green-400 font-semibold">
                      ₹{earning.netEarning.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(earning.status)}`}>
                        {earning.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-400">
                      {new Date(earning.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
