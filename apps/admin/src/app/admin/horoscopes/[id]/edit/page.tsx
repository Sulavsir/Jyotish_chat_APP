'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import {
  Label,
  Textarea,
  ArrowLeftIcon,
  Button,
  DateInput,
} from '@jyotish/ui';
import { LoadingButton } from '@/components/ui';
import { ADMIN_ROUTES, ADMIN_QUERY_KEYS } from '@/constants';
import type { UpdateHoroscopeRequest, HoroscopeCategory } from '@/types';
import { toast } from 'sonner';

const CATEGORIES: HoroscopeCategory[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
const ZODIAC_SIGNS = [
  'ARIES',
  'TAURUS',
  'GEMINI',
  'CANCER',
  'LEO',
  'VIRGO',
  'LIBRA',
  'SCORPIO',
  'SAGITTARIUS',
  'CAPRICORN',
  'AQUARIUS',
  'PISCES',
];

const formSchema = z.object({
  zodiacSign: z
    .string()
    .min(1, 'Select a Rashi')
    .refine((v) => ZODIAC_SIGNS.includes(v), { message: 'Select a valid Rashi' }),
  category: z
    .string()
    .min(1, 'Select period')
    .refine((v) => CATEGORIES.includes(v as HoroscopeCategory), { message: 'Select a valid period' }),
  date: z.string().min(1, 'Date is required'),
  content: z.string().min(1, 'Content is required').max(50000),
});

type FormData = z.infer<typeof formSchema>;

const selectClassName =
  'mt-1.5 h-11 w-full rounded-md border-2 border-purple-500/30 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder:text-slate-400 hover:border-purple-400/50 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 disabled:opacity-50';

export default function EditHoroscopePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const queryClient = useQueryClient();

  const { data, isLoading: loadingHoroscope } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.HOROSCOPES.DETAIL(id),
    queryFn: () => adminApi.horoscopes.get(id),
    enabled: !!id,
  });

  const horoscope = data?.horoscope;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      zodiacSign: '',
      category: 'DAILY',
      date: '',
      content: '',
    },
  });

  useEffect(() => {
    if (horoscope) {
      reset({
        zodiacSign: horoscope.zodiacSign,
        category: horoscope.category,
        date: new Date(horoscope.date).toISOString().slice(0, 10),
        content: horoscope.content,
      });
    }
  }, [horoscope, reset]);

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateHoroscopeRequest) =>
      adminApi.horoscopes.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.HOROSCOPES.ALL });
      toast.success('Horoscope updated');
      router.push(ADMIN_ROUTES.HOROSCOPES);
    },
    onError: (e: Error) => toast.error(e?.message || 'Update failed'),
  });

  const onSubmit = (data: FormData) => {
    updateMutation.mutate({
      zodiacSign: data.zodiacSign,
      category: data.category as HoroscopeCategory,
      date: data.date,
      content: data.content,
    });
  };

  if (!id) {
    return (
      <AdminLayout>
        <div className="text-red-400">Invalid horoscope ID</div>
      </AdminLayout>
    );
  }

  if (loadingHoroscope && !horoscope) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!horoscope) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <p className="text-red-400">Horoscope not found</p>
          <Button
            variant="outline"
            onClick={() => router.push(ADMIN_ROUTES.HOROSCOPES)}
            className="border-slate-600 text-slate-300"
          >
            Back to list
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="w-full max-w-full text-left space-y-6">
        {/* Header - aligned from start */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push(ADMIN_ROUTES.HOROSCOPES)}
            className="p-2 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
            aria-label="Back to horoscopes"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold cosmic-text">Edit Horoscope</h1>
            <p className="text-slate-400 mt-1">
              {horoscope.zodiacSign} · {horoscope.category}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Details row */}
          <div className="cosmic-card p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <Label htmlFor="zodiacSign" className="text-slate-200">
                  Rashi <span className="text-red-400">*</span>
                </Label>
                <select
                  id="zodiacSign"
                  {...register('zodiacSign')}
                  className={selectClassName}
                  aria-invalid={!!errors.zodiacSign}
                >
                  {ZODIAC_SIGNS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {errors.zodiacSign && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.zodiacSign.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-slate-200">
                  Period <span className="text-red-400">*</span>
                </Label>
                <select
                  id="category"
                  {...register('category')}
                  className={selectClassName}
                  aria-invalid={!!errors.category}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.category.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-slate-200">
                  Date <span className="text-red-400">*</span>
                </Label>
                <DateInput
                  id="date"
                  {...register('date')}
                  className="mt-1.5 w-full bg-slate-900/50 border-purple-500/30 text-white [color-scheme:dark]"
                  iconClassName="text-purple-400"
                />
                {errors.date && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.date.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="cosmic-card p-6">
            <Label htmlFor="content" className="text-slate-200">
              Horoscope text <span className="text-red-400">*</span>
            </Label>
            <Textarea
              id="content"
              {...register('content')}
              rows={14}
              placeholder="Enter the horoscope prediction..."
              className="mt-1.5 w-full rounded-md border-2 border-purple-500/30 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder:text-slate-500 hover:border-purple-400/50 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 resize-y min-h-[280px]"
              aria-invalid={!!errors.content}
            />
            {errors.content && (
              <p className="text-red-400 text-sm mt-1">{errors.content.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(ADMIN_ROUTES.HOROSCOPES)}
              disabled={updateMutation.isPending}
              className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              isLoading={updateMutation.isPending}
              loadingText="Saving..."
            >
              Update horoscope
            </LoadingButton>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
