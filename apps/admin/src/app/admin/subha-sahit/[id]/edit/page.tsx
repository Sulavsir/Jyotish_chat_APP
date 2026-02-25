'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import { ADMIN_QUERY_KEYS, ADMIN_ROUTES } from '@/constants';
import type { SubhaSahitDate } from '@/types';
import { Button, DateInput, Label, Textarea } from '@jyotish/ui';
import { LoadingButton } from '@/components/ui';
import { toast } from 'sonner';

export default function EditSubhaSahitDatePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const queryClient = useQueryClient();

  if (!id || typeof id !== 'string') {
    router.push(ADMIN_ROUTES.SUBHA_SAHIT);
    return null;
  }

  const { data, isLoading } = useQuery<SubhaSahitDate>({
    queryKey: ADMIN_QUERY_KEYS.SUBHA_SAHIT.DETAIL(id),
    queryFn: async () => {
      const res = await adminApi.subhaSahit.get(id);
      return res.date as SubhaSahitDate;
    },
  });

  const [date, setDate] = useState('');
  const [occasion, setOccasion] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!data) return;
    const isoDate = new Date(data.date).toISOString().slice(0, 10);
    setDate(isoDate);
    setOccasion(data.occasion);
    setDescription(data.description ?? '');
    setIsActive(data.isActive);
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!date.trim()) {
        toast.error('Date is required');
        return;
      }
      if (!occasion.trim()) {
        toast.error('Occasion is required');
        return;
      }
      const payload = {
        date: date.trim(),
        occasion: occasion.trim(),
        description: description.trim() || undefined,
        isActive,
      };
      await adminApi.subhaSahit.update(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.SUBHA_SAHIT.ALL });
      toast.success('Subha Sahit date updated');
      router.push(ADMIN_ROUTES.SUBHA_SAHIT);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to update date';
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  const isSaving = updateMutation.isPending;

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <button
            type="button"
            onClick={() => router.push(ADMIN_ROUTES.SUBHA_SAHIT)}
            className="mb-4 text-sm text-slate-400 hover:text-white"
          >
            ← Back to Subha Sahit
          </button>
          <h1 className="text-2xl font-bold text-white">Edit Subha Sahit Date</h1>
          <p className="text-slate-400 text-sm">
            Update the auspicious date, occasion, and description. Language remains the same.
          </p>
        </div>

        {isLoading || !data ? (
          <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-6 text-slate-300">
            Loading date details...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-200 text-sm">
                    Date <span className="text-red-400">*</span>
                  </Label>
                  <DateInput
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-slate-900/50 border-purple-500/30 text-white [color-scheme:dark]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-200 text-sm">
                    Occasion <span className="text-red-400">*</span>
                  </Label>
                  <input
                    type="text"
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    className="mt-1.5 w-full rounded-md border-2 border-purple-500/30 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
                    placeholder="Occasion name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-200 text-sm">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Optional description for this auspicious date"
                  className="mt-1.5 w-full rounded-md border-2 border-purple-500/30 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40 resize-y"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-slate-200">Status</p>
                  <p className="text-xs text-slate-400">
                    {isActive
                      ? 'This date is active and visible to clients.'
                      : 'This date is inactive and hidden from clients.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive((prev) => !prev)}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                    isActive
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                      : 'border-slate-600 bg-slate-800 text-slate-300'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isActive ? 'bg-emerald-400' : 'bg-slate-500'
                    }`}
                  />
                  {isActive ? 'Active' : 'Inactive'}
                </button>
              </div>

              <div className="space-y-0.5 text-xs text-slate-500">
                <p>
                  Language:{' '}
                  <span className="font-medium text-slate-300">
                    {data?.language ?? 'EN'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(ADMIN_ROUTES.SUBHA_SAHIT)}
                disabled={isSaving}
                className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Cancel
              </Button>
              <LoadingButton type="submit" isLoading={isSaving} loadingText="Saving...">
                Update Subha Sahit
              </LoadingButton>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
