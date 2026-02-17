'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Button, DateInput } from '@jyotish/ui';
import { QUERY_KEYS } from '@/constants';
import { horoscopeService } from '@/services';
import { ZODIAC_SIGNS, HOROSCOPE_CATEGORIES } from '@/constants/horoscope.constants';
import { getDateRangeForCategory, HoroscopeCategory } from '@jyotish/shared';

function formatPeriodLabel(category: HoroscopeCategory, date: Date): string {
  const d = new Date(date);
  switch (category) {
    case 'DAILY':
      return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    case 'WEEKLY': {
      const { start, end } = getDateRangeForCategory('WEEKLY', d);
      return `Week of ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    case 'MONTHLY':
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    case 'YEARLY':
      return d.getFullYear().toString();
    default:
      return d.toLocaleDateString();
  }
}

function toDateParam(category: HoroscopeCategory, date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  if (category === 'MONTHLY') return `${y}-${m}-01`;
  if (category === 'YEARLY') return `${y}-01-01`;
  return `${y}-${m}-${day}`;
}

export default function HoroscopePage() {
  const [category, setCategory] = useState<HoroscopeCategory>(HoroscopeCategory.DAILY);
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const [periodDate, setPeriodDate] = useState<Date>(() => new Date());

  const dateParam = useMemo(() => toDateParam(category, periodDate), [category, periodDate]);
  const selectedSignMeta = useMemo(
    () => (selectedSign ? ZODIAC_SIGNS.find((s) => s.value === selectedSign) : null),
    [selectedSign]
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: QUERY_KEYS.HOROSCOPE.GET(selectedSign ?? '', category, dateParam),
    queryFn: () =>
      horoscopeService.getHoroscope({
        zodiacSign: selectedSign!,
        category,
        date: dateParam,
      }),
    enabled: !!selectedSign,
  });

  const horoscope = data?.horoscope;
  const periodLabel = formatPeriodLabel(category, periodDate);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header + controls (single row) */}
        <Card className="bg-black/40 backdrop-blur-md border-purple-500/30">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h1 className="text-3xl sm:text-4xl font-bold text-white flex items-center gap-3">
                  ⭐ Horoscope
                </h1>
                <p className="text-gray-400 mt-1">
                  Choose period and Rashi to view your cosmic forecast
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <div className="flex flex-wrap gap-2">
                  {HOROSCOPE_CATEGORIES.map((c) => {
                    const isActive = category === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCategory(c.value)}
                        className={[
                          'px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-colors',
                          'focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                          isActive
                            ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_18px_rgba(168,85,247,0.6)]'
                            : 'bg-transparent border-white/20 text-gray-300 hover:bg-white/10 hover:border-purple-400/60',
                        ].join(' ')}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400 shrink-0">Date</span>
                  <DateInput
                    value={
                      category === 'YEARLY'
                        ? `${periodDate.getFullYear()}-01-01`
                        : periodDate.toISOString().slice(0, 10)
                    }
                    onChange={(e) => {
                      const d = new Date(e.target.value);
                      if (!isNaN(d.getTime())) {
                        setPeriodDate(category === 'YEARLY' ? new Date(d.getFullYear(), 0, 1) : d);
                      }
                    }}
                    className="bg-white/5 border-white/20 text-white w-44"
                    iconClassName="text-purple-400"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rashi (Zodiac) selector */}
        <Card className="bg-black/40 backdrop-blur-md border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white">Select Rashi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {ZODIAC_SIGNS.map((sign) => (
                <button
                  key={sign.value}
                  type="button"
                  onClick={() => setSelectedSign(sign.value)}
                  className={`p-4 rounded-lg border transition-all text-left ${
                    selectedSign === sign.value
                      ? 'bg-purple-600/40 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/50'
                  }`}
                >
                  <div className="text-4xl mb-2">{sign.icon}</div>
                  <p className="text-white font-medium text-sm">{sign.name}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Horoscope content */}
        {selectedSign ? (
          <Card className="bg-black/40 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <span>
                  {selectedSignMeta?.icon} {selectedSignMeta?.name}
                </span>
                <span className="text-sm font-normal text-gray-400">· {periodLabel}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="flex items-center gap-2 text-gray-400 py-8">
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                  Loading horoscope...
                </div>
              )}
              {isError && (
                <p className="text-red-400 py-4">{error?.message ?? 'Failed to load horoscope'}</p>
              )}
              {!isLoading && !isError && horoscope && (
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {horoscope.prediction}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-black/40 backdrop-blur-md border-white/10">
            <CardContent className="py-20">
              <div className="text-center">
                <div className="text-6xl mb-4">🌟</div>
                <h3 className="text-xl font-semibold text-white mb-2">Select your Rashi</h3>
                <p className="text-gray-400">
                  Choose a period above and your zodiac sign to view your horoscope
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscribe CTA */}
        <Card className="bg-slate-900/50 backdrop-blur-md border-slate-700">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">📧 Never miss your horoscope</h3>
                <p className="text-gray-300 text-sm">
                  Subscribe to receive your daily cosmic forecast via SMS every morning
                </p>
              </div>
              <Button color="primary" className="whitespace-nowrap">
                Subscribe
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
