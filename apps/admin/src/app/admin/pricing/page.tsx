'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import { Button, Search, EmptyState } from '@jyotish/ui';
import { AdminTable, type AdminTableColumn } from '@/components/admin';
import { ADMIN_ROUTES, ADMIN_QUERY_KEYS } from '@/constants';
import type { PricingPlan } from '@/types';
import { toast } from 'sonner';

import { RefreshCw } from 'lucide-react';

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

export default function PricingManagementPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all pricing plans with TanStack Query
  const {
    data: plansData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.PRICING.LIST(),
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
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.PRICING.ALL });
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
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.PRICING.ALL });
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

  const columns: AdminTableColumn<PricingPlan>[] = [
    {
      header: 'Plan Name',
      accessor: (plan) => (
        <div>
          <div className="font-medium text-white">{plan.name}</div>
          {plan.description && (
            <div className="text-sm text-slate-400 mt-1 max-w-xs truncate">{plan.description}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Price (NPR)',
      accessor: (plan) => (
        <span className="font-semibold text-purple-400">
          NPR {plan.priceInNrs.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Balance/Unlimited',
      accessor: (plan) =>
        plan.isUnlimited ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
            ∞ Unlimited
          </span>
        ) : (
          <span className="text-emerald-400 font-semibold">{plan.coins}</span>
        ),
    },
    {
      header: 'Validity',
      accessor: (plan) =>
        plan.validityInDays ? (
          <span className="text-slate-300">{plan.validityInDays} days</span>
        ) : (
          <span className="text-slate-400">Lifetime</span>
        ),
    },
    {
      header: 'Discount',
      accessor: (plan) =>
        plan.discountPercent ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
            {plan.discountPercent}% OFF
          </span>
        ) : (
          <span className="text-slate-500">—</span>
        ),
    },
    {
      header: 'Status',
      accessor: (plan) => (
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
      ),
    },
    {
      header: 'Featured',
      accessor: (plan) =>
        plan.isFeatured ? (
          <svg
            className="w-5 h-5 text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5 text-slate-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
    },
    {
      header: 'Actions',
      accessor: (plan) => (
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
      ),
      className: 'text-right',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-5 sm:space-y-6">
        {/* Header — same responsive pattern as Horoscopes: mobile Refresh beside title; sm+ actions row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold cosmic-text truncate">
                Pricing Management
              </h1>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={() => refetch()}
                className="border-slate-700 text-white hover:bg-slate-800 shrink-0 w-auto sm:hidden"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            <p className="text-sm sm:text-base text-slate-400 mt-1">
              Manage pricing plans and offers
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={() => refetch()}
              className="hidden sm:inline-flex border-slate-700 text-white hover:bg-slate-800 w-full sm:w-auto"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => router.push(ADMIN_ROUTES.PRICING_CREATE)}
              className="gap-2 w-full sm:w-auto"
            >
              <PlusIcon className="w-4 h-4" />
              Create Plan
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="w-full">
          <Search
            placeholder="Search pricing plans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="cosmic-card overflow-hidden">
          <AdminTable
            data={filteredPlans}
            columns={columns}
            loading={isLoading}
            keyExtractor={(plan) => plan.id}
            emptyState={{
              title: 'No pricing plans found',
              description: searchQuery
                ? 'Try adjusting your search criteria'
                : 'Get started by creating your first pricing plan',
              action: !searchQuery
                ? {
                    label: 'Create First Plan',
                    onClick: () => router.push(ADMIN_ROUTES.PRICING_CREATE),
                  }
                : undefined,
              icon: <></>,
            }}
          />
        </div>

        {/* Stats */}
        {!isLoading && filteredPlans.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
