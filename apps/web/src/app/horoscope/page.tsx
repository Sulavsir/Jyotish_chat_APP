'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { DateInput, Spinner } from '@jyotish/ui';
import { QUERY_KEYS, ROUTES } from '@/constants';
import { horoscopeService } from '@/services';
import { ZODIAC_SIGNS, HOROSCOPE_CATEGORIES } from '@/constants/horoscope.constants';
import { getDateRangeForCategory, HoroscopeCategory, getRashiDisplayName } from '@jyotish/shared';
import { useRequireAuth } from '@/hooks';
import { USER_ROLES } from '@/constants';
import { useQuestionnaireLanguageStore } from '@/store/questionnaire-language.store';
import Link from 'next/link';
import { Sparkles, Calendar, Sun } from 'lucide-react';

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
  const { user } = useRequireAuth({ requiredRole: USER_ROLES.CLIENT });
  const language = useQuestionnaireLanguageStore((s) => s.language);
  const userZodiacSign = (user as { zodiacSign?: string })?.zodiacSign ?? null;

  const [category, setCategory] = useState<HoroscopeCategory>(HoroscopeCategory.DAILY);
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const [periodDate, setPeriodDate] = useState<Date>(() => new Date());

  useEffect(() => {
    if (userZodiacSign && selectedSign === null) {
      setSelectedSign(userZodiacSign);
    }
  }, [userZodiacSign, selectedSign]);

  const dateParam = useMemo(() => toDateParam(category, periodDate), [category, periodDate]);
  const periodLabel = formatPeriodLabel(category, periodDate);

  // Fetch all horoscopes for grid display
  const queries = useQueries({
    queries: ZODIAC_SIGNS.map((sign) => ({
      queryKey: QUERY_KEYS.HOROSCOPE.GET(sign.value, category, dateParam, language),
      queryFn: () =>
        horoscopeService.getHoroscope({
          zodiacSign: sign.value,
          category,
          date: dateParam,
          language,
        }),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const selectedIndex = selectedSign ? ZODIAC_SIGNS.findIndex((s) => s.value === selectedSign) : -1;
  const selectedHoroscope = selectedIndex >= 0 ? queries[selectedIndex]?.data?.horoscope : null;
  const selectedSignMeta = useMemo(
    () => (selectedSign ? ZODIAC_SIGNS.find((s) => s.value === selectedSign) : null),
    [selectedSign]
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-black">
        {/* Hero Section */}
        <section className="relative pt-8 pb-12 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-950/30 via-transparent to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.1),transparent_50%)]" />
          <div className="container mx-auto max-w-7xl relative z-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-semibold text-purple-300 uppercase tracking-wider">
                  Cosmic Insights
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-pink-300 to-red-300">
                Your Horoscope
              </h1>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                {selectedSign
                  ? `Viewing ${getRashiDisplayName(selectedSign, language)} horoscope`
                  : 'Select your rashi to view personalized cosmic forecast'}
              </p>
            </div>

            {/* Period Selector */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-black/40 backdrop-blur-md border border-purple-500/30 rounded-2xl p-6 shadow-xl shadow-purple-500/10">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="flex-1">
                    <label className="text-sm font-semibold text-purple-300 uppercase tracking-wider mb-3 block">
                      Select Period
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {HOROSCOPE_CATEGORIES.map((c) => {
                        const isActive = category === c.value;
                        return (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => setCategory(c.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                              isActive
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-purple-500 text-white shadow-lg shadow-purple-500/50'
                                : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 hover:border-purple-500/50'
                            }`}
                          >
                            {c.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-purple-400" />
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
                      className="bg-white/5 border-purple-500/30 text-white [color-scheme:dark] min-w-[180px]"
                      iconClassName="text-purple-400"
                    />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-purple-500/20">
                  <p className="text-sm text-gray-400">
                    <span className="text-purple-300 font-medium">{periodLabel}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Selected Horoscope Display */}
        {selectedSign && (
          <section className="py-8 px-4">
            <div className="container mx-auto max-w-4xl">
              <div className="group relative bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent border border-purple-500/20 rounded-2xl p-8 hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/10 rounded-full blur-2xl opacity-50" />
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500/30 to-indigo-500/20 flex items-center justify-center text-4xl shadow-lg shadow-purple-500/20">
                      {selectedSignMeta?.icon}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {getRashiDisplayName(selectedSign, language)}
                      </h2>
                      <p className="text-sm text-gray-400 uppercase tracking-wider">{selectedSign}</p>
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="flex items-center gap-2 text-gray-500 py-8">
                      <Spinner className="h-5 w-5" />
                      <span>Loading horoscope...</span>
                    </div>
                  ) : selectedHoroscope?.prediction ? (
                    <div className="space-y-4">
                      <p className="text-base text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {selectedHoroscope.prediction}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-purple-400">
                        <Sun className="h-4 w-4" />
                        <span>{category} Prediction</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic py-4">
                      No horoscope available for this period.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* All Horoscopes Grid */}
        <section className="py-8 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">All Rashis</h2>
              <p className="text-gray-400">
                Your rashi is highlighted. To change it, go to{' '}
                <Link href={ROUTES.PROFILE} className="text-purple-400 hover:underline">
                  Profile
                </Link>
                .
              </p>
            </div>

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20">
                <Spinner className="h-12 w-12 text-purple-400 mb-4" />
                <p className="text-gray-400">Loading horoscopes...</p>
              </div>
            )}

            {!isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {ZODIAC_SIGNS.map((sign, i) => {
                  const { data, isFetching } = queries[i] ?? {};
                  const prediction = data?.horoscope?.prediction ?? '';
                  const label = getRashiDisplayName(sign.value, language);
                  const isSelected = selectedSign === sign.value;

                  return (
                    <button
                      key={sign.value}
                      type="button"
                      onClick={() => setSelectedSign(sign.value)}
                      className={`group relative bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent border rounded-2xl p-6 hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 text-left ${
                        isSelected
                          ? 'border-purple-500/60 shadow-lg shadow-purple-500/30'
                          : 'border-purple-500/20'
                      }`}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-indigo-500/20 flex items-center justify-center text-3xl shadow-lg shadow-purple-500/20">
                            {sign.icon}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">{label}</h3>
                            <p className="text-xs text-gray-400 uppercase tracking-wider">{sign.value}</p>
                          </div>
                        </div>

                        {isFetching ? (
                          <div className="flex items-center gap-2 text-gray-500 py-4">
                            <Spinner className="h-4 w-4" />
                            <span className="text-sm">Loading...</span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-sm text-gray-300 leading-relaxed line-clamp-5">
                              {prediction || (
                                <span className="text-gray-500 italic">
                                  No horoscope available for this period.
                                </span>
                              )}
                            </p>
                            {prediction && (
                              <div className="flex items-center gap-2 text-xs text-purple-400">
                                <Sun className="h-3.5 w-3.5" />
                                <span>{category} Prediction</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
