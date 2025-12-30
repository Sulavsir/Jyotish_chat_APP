'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { EmptyState } from '@/components/ui/empty-state';

interface Astrologer {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string[];
  experience: number;
  rating: number;
  isActive: boolean;
  isOnline: boolean;
  commissionRate: number;
}

export default function AstrologersPage() {
  const router = useRouter();
  const [astrologers, setAstrologers] = useState<Astrologer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAstrologers();
  }, []);

  const loadAstrologers = async () => {
    try {
      const response: any = await adminApi.astrologers.list();
      if (Array.isArray(response)) {
        setAstrologers(response);
      } else if (response?.astrologers) {
        setAstrologers(response.astrologers);
      }
    } catch (error) {
      console.error('Failed to load astrologers:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      await adminApi.astrologers.toggleStatus(id);
      loadAstrologers();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const filteredAstrologers = astrologers.filter((astro) =>
    astro.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    astro.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    astro.phone?.includes(searchTerm)
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">Astrologers</h2>
            <p className="text-slate-400 mt-1">Manage your cosmic advisors</p>
          </div>
          <button
            onClick={() => router.push('/admin/astrologers/create')}
            className="cosmic-btn px-6 py-3 rounded-lg text-white font-semibold flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Astrologer
          </button>
        </div>

        {/* Search Bar */}
        <div className="cosmic-card rounded-xl p-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search astrologers by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cosmic-purple transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        <div className="cosmic-card rounded-xl overflow-hidden">
          {loading ? (
            <TableSkeleton rows={5} columns={7} />
          ) : filteredAstrologers.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-20 h-20 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              }
              title={searchTerm ? 'No astrologers found' : 'No astrologers yet'}
              description={
                searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Get started by adding your first astrologer to the platform'
              }
              action={{
                label: 'Add Astrologer',
                onClick: () => router.push('/admin/astrologers/create'),
              }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAstrologers.map((astrologer) => (
                  <TableRow key={astrologer.id}>
                    <TableCell className="font-medium">{astrologer.name}</TableCell>
                    <TableCell>{astrologer.email}</TableCell>
                    <TableCell>{astrologer.phone}</TableCell>
                    <TableCell>{astrologer.experience} years</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {astrologer.rating.toFixed(1)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          astrologer.isActive
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {astrologer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => toggleStatus(astrologer.id)}
                        className="px-3 py-1 text-sm rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors cursor-pointer"
                      >
                        Toggle Status
                      </button>
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
