'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import { Input, Label, Textarea, ArrowLeftIcon, Button } from '@jyotish/ui';
import { LoadingButton } from '@/components/ui';
import { ADMIN_ROUTES } from '@/constants';
import type { CreatePricingPlanRequest } from '@/types';
import { toast } from 'sonner';

const pricingPlanSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  description: z.string().optional(),
  priceInNrs: z.number().min(1, 'Price must be at least 1 NPR'),
  coins: z.number().min(1, 'Coins must be at least 1'),
  validityInDays: z.number().optional(),
  isUnlimited: z.boolean(),
  discountPercent: z.number().min(0).max(100).optional(),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
});

type PricingPlanFormData = z.infer<typeof pricingPlanSchema>;

export default function CreatePricingPlanPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PricingPlanFormData>({
    resolver: zodResolver(pricingPlanSchema),
    defaultValues: {
      isUnlimited: false,
      isFeatured: false,
      isActive: true,
    },
  });

  const isUnlimited = watch('isUnlimited');

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreatePricingPlanRequest) => adminApi.pricing.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
      toast.success('Pricing plan created successfully');
      router.push(ADMIN_ROUTES.PRICING);
    },
    onError: (error: Error) => {
      console.error('Error creating pricing plan:', error);
      toast.error(error?.message || 'Failed to create pricing plan');
    },
  });

  const onSubmit = (data: PricingPlanFormData) => {
    // Transform data
    const payload: CreatePricingPlanRequest = {
      name: data.name,
      description: data.description || undefined,
      priceInNrs: Number(data.priceInNrs),
      coins: Number(data.coins),
      validityInDays: data.validityInDays ? Number(data.validityInDays) : undefined,
      isUnlimited: data.isUnlimited,
      discountPercent: data.discountPercent ? Number(data.discountPercent) : undefined,
      isFeatured: data.isFeatured,
      isActive: data.isActive,
    };

    createMutation.mutate(payload);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(ADMIN_ROUTES.PRICING)}
            className="p-2 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold cosmic-text">Create Pricing Plan</h1>
            <p className="text-slate-400 mt-1">Add a new pricing plan for customers</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="cosmic-card p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Basic Information</h2>

            <div>
              <Label htmlFor="name">Plan Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., 10 Chat Pack"
                className="mt-1.5"
              />
              {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Describe what this plan offers..."
                rows={3}
                className="mt-1.5"
              />
              {errors.description && (
                <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Pricing Details */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Pricing Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priceInNrs">Price (NPR) *</Label>
                <Input
                  id="priceInNrs"
                  type="number"
                  step="0.01"
                  {...register('priceInNrs', { valueAsNumber: true })}
                  placeholder="1000"
                  className="mt-1.5"
                />
                {errors.priceInNrs && (
                  <p className="text-red-400 text-sm mt-1">{errors.priceInNrs.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="coins">Coins *</Label>
                <Input
                  id="coins"
                  type="number"
                  {...register('coins', { valueAsNumber: true })}
                  placeholder="10"
                  className="mt-1.5"
                />
                {errors.coins && (
                  <p className="text-red-400 text-sm mt-1">{errors.coins.message}</p>
                )}
                <p className="text-xs text-slate-400 mt-1">100 NPR = 1 Coin = 1 Chat</p>
              </div>

              <div>
                <Label htmlFor="discountPercent">Discount Percentage</Label>
                <Input
                  id="discountPercent"
                  type="number"
                  step="0.01"
                  {...register('discountPercent', { valueAsNumber: true })}
                  placeholder="10"
                  className="mt-1.5"
                />
                {errors.discountPercent && (
                  <p className="text-red-400 text-sm mt-1">{errors.discountPercent.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="validityInDays">Validity (Days)</Label>
                <Input
                  id="validityInDays"
                  type="number"
                  {...register('validityInDays', { valueAsNumber: true })}
                  placeholder="30"
                  className="mt-1.5"
                  disabled={isUnlimited}
                />
                {errors.validityInDays && (
                  <p className="text-red-400 text-sm mt-1">{errors.validityInDays.message}</p>
                )}
                <p className="text-xs text-slate-400 mt-1">Leave empty for lifetime validity</p>
              </div>
            </div>
          </div>

          {/* Plan Options */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Plan Options</h2>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 rounded-lg bg-slate-900/50 border border-purple-500/20 hover:border-purple-500/40 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isUnlimited')}
                  className="w-4 h-4 rounded border-purple-500/30 bg-slate-900/50 text-purple-600 focus:ring-purple-500/50"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setValue('validityInDays', undefined);
                    }
                  }}
                />
                <div>
                  <div className="font-medium text-white">Unlimited Plan</div>
                  <div className="text-sm text-slate-400">
                    Unlimited chats within validity period
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 rounded-lg bg-slate-900/50 border border-purple-500/20 hover:border-purple-500/40 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isFeatured')}
                  className="w-4 h-4 rounded border-purple-500/30 bg-slate-900/50 text-purple-600 focus:ring-purple-500/50"
                />
                <div>
                  <div className="font-medium text-white">Featured Plan</div>
                  <div className="text-sm text-slate-400">
                    Highlight this plan with a special badge
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 rounded-lg bg-slate-900/50 border border-purple-500/20 hover:border-purple-500/40 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="w-4 h-4 rounded border-purple-500/30 bg-slate-900/50 text-purple-600 focus:ring-purple-500/50"
                />
                <div>
                  <div className="font-medium text-white">Active</div>
                  <div className="text-sm text-slate-400">
                    Make this plan available to customers
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-purple-500/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(ADMIN_ROUTES.PRICING)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              isLoading={createMutation.isPending}
              loadingText="Creating..."
            >
              Create Plan
            </LoadingButton>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
