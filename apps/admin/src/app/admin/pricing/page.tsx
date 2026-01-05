'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Search,
  EmptyState,
} from '@jyotish/ui';
import { ADMIN_ROUTES } from '@/constants';
import type { PricingPlan } from '@/types';
import { toast } from 'sonner';

// Inline icon components to avoid import issues
const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const PencilIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
    />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const TableSkeleton = ({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) => (
  <div className="cosmic-card overflow-hidden">
    <Table>
      <TableHeader>
        <TableRow>
          {Array.from({ length: columns }).map((_, i) => (
            <TableHead key={i}>
              <div className="h-4 w-full animate-pulse rounded-md bg-slate-700/50" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <TableCell key={colIndex}>
                <div className="h-4 w-full animate-pulse rounded-md bg-slate-700/50" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export default function PricingManagementPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all pricing plans with TanStack Query
  const { data: plansData, isLoading } = useQuery({
    queryKey: ['pricing-plans'],
    queryFn: () => adminApi.pricing.getAll(),
  });

  const plans = plansData?.plans || [];

  // Filter plans based on search
  const filteredPlans = useMemo(() => {
    if (!searchQuery) return plans;
    return plans.filter(
      (plan) =>
        plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [plans, searchQuery]);

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => adminApi.pricing.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
      toast.success('Plan status updated successfully');
    },
    onError: (error: Error) => {
      console.error('Error toggling plan status:', error);
      toast.error(error?.message || 'Failed to update plan status');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.pricing.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
      toast.success('Plan deleted successfully');
    },
    onError: (error: Error) => {
      console.error('Error deleting plan:', error);
      toast.error(error?.message || 'Failed to delete plan');
    },
  });

  const handleToggleStatus = (id: string) => {
    toggleStatusMutation.mutate(id);
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    deleteMutation.mutate(id);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold cosmic-text">Pricing Management</h1>
            <p className="text-slate-400 mt-1">Manage pricing plans and offers</p>
          </div>
          <Button onClick={() => router.push(ADMIN_ROUTES.PRICING_CREATE)} className="gap-2">
            <PlusIcon className="w-4 h-4" />
            Create Plan
          </Button>
        </div>

        {/* Search */}
        <Search
          placeholder="Search pricing plans..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Table */}
        {isLoading ? (
          <TableSkeleton rows={5} columns={8} />
        ) : filteredPlans.length === 0 ? (
          <EmptyState
            title="No pricing plans found"
            description={
              searchQuery
                ? 'Try adjusting your search criteria'
                : 'Get started by creating your first pricing plan'
            }
            action={
              !searchQuery
                ? {
                    label: 'Create First Plan',
                    onClick: () => router.push(ADMIN_ROUTES.PRICING_CREATE),
                  }
                : undefined
            }
          />
        ) : (
          <div className="cosmic-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Price (NPR)</TableHead>
                  <TableHead>Coins/Unlimited</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-white">{plan.name}</div>
                        {plan.description && (
                          <div className="text-sm text-slate-400 mt-1 max-w-xs truncate">
                            {plan.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-purple-400">
                        NPR {plan.priceInNrs.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      {plan.isUnlimited ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          ∞ Unlimited
                        </span>
                      ) : (
                        <span className="text-white">{plan.coins} coins</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {plan.validityInDays ? (
                        <span className="text-slate-300">{plan.validityInDays} days</span>
                      ) : (
                        <span className="text-slate-400">Lifetime</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {plan.discountPercent ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                          {plan.discountPercent}% OFF
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggleStatus(plan.id)}
                        disabled={toggleStatusMutation.isPending}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
                          plan.isActive
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                        }`}
                      >
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </TableCell>
                    <TableCell>
                      {plan.isFeatured ? (
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(ADMIN_ROUTES.PRICING_EDIT(plan.id))}
                          className="p-2 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(plan.id, plan.name)}
                          disabled={deleteMutation.isPending}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Stats */}
        {!isLoading && filteredPlans.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="cosmic-card p-4">
              <div className="text-sm text-slate-400">Total Plans</div>
              <div className="text-2xl font-bold text-white mt-1">{plans.length}</div>
            </div>
            <div className="cosmic-card p-4">
              <div className="text-sm text-slate-400">Active Plans</div>
              <div className="text-2xl font-bold text-green-400 mt-1">
                {plans.filter((p) => p.isActive).length}
              </div>
            </div>
            <div className="cosmic-card p-4">
              <div className="text-sm text-slate-400">Featured Plans</div>
              <div className="text-2xl font-bold text-purple-400 mt-1">
                {plans.filter((p) => p.isFeatured).length}
              </div>
            </div>
            <div className="cosmic-card p-4">
              <div className="text-sm text-slate-400">Inactive Plans</div>
              <div className="text-2xl font-bold text-red-400 mt-1">
                {plans.filter((p) => !p.isActive).length}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
