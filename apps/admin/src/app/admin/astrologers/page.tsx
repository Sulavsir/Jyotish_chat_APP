'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import { Button, Search } from '@jyotish/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
  EmptyState,
  PlusIcon,
  StarIcon,
} from '@jyotish/ui';
import { ADMIN_ROUTES } from '@/constants';
import type { Astrologer } from '@/types';

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

  const filteredAstrologers = astrologers.filter(
    (astro) =>
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
          <Button
            onClick={() => router.push(ADMIN_ROUTES.ASTROLOGERS_CREATE)}
            className="flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Add Astrologer
          </Button>
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
          {loading ? (
            <TableSkeleton rows={5} columns={7} />
          ) : filteredAstrologers.length === 0 ? (
            <EmptyState
              icon={<StarIcon className="w-20 h-20 text-slate-600" />}
              title={searchTerm ? 'No astrologers found' : 'No astrologers yet'}
              description={
                searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Get started by adding your first astrologer to the platform'
              }
              action={{
                label: 'Add Astrologer',
                onClick: () => router.push(ADMIN_ROUTES.ASTROLOGERS_CREATE),
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
                        <StarIcon className="w-4 h-4 text-yellow-500" />
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleStatus(astrologer.id)}
                      >
                        Toggle Status
                      </Button>
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
