'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/ui';
import { getRashiDisplayName, HoroscopeCategory, getDateRangeForCategory, QUESTIONNAIRE_LANGUAGES, LANGUAGE_DISPLAY_LABELS, type QuestionnaireLanguage } from '@jyotish/shared';
import { horoscopeService } from '@/services/horoscopeService';
import { QUERY_KEYS } from '@/constants';
import { ZODIAC_SIGNS, HOROSCOPE_CATEGORIES } from '@/constants/horoscope.constants';
import { DateInput, Spinner } from '@jyotish/ui';
import { Sparkles, Calendar, Sun, Globe } from 'lucide-react';
import { Footer } from '@/components/home';

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

export default function PublicHoroscopesPage() {
  const [category, setCategory] = useState<HoroscopeCategory>(HoroscopeCategory.DAILY);
  const [periodDate, setPeriodDate] = useState<Date>(() => new Date());
  const [language, setLanguage] = useState<QuestionnaireLanguage>('ENGLISH');

  const dateParam = useMemo(() => toDateParam(category, periodDate), [category, periodDate]);
  const periodLabel = formatPeriodLabel(category, periodDate);

  const { data: batchData, isLoading } = useQuery({
    queryKey: QUERY_KEYS.HOROSCOPE.BATCH(category, dateParam, language),
    queryFn: () =>
      horoscopeService.getHoroscopesBatch({
        category,
        date: dateParam,
        language,
      }),
    staleTime: 5 * 60 * 1000,
  });

  const horoscopesBySign = useMemo(() => {
    const list = batchData?.horoscopes ?? [];
    return new Map(list.map((h) => [h.zodiacSign, h]));
  }, [batchData]);

  const hasAnyData = (batchData?.horoscopes ?? []).some((h) => !!h.prediction);

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950/30 via-transparent to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.1),transparent_50%)]" />
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-semibold text-purple-300 uppercase tracking-wider">
                Cosmic Insights
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-pink-300 to-red-300">
              Today&apos;s Horoscope
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Discover your cosmic forecast for all rashis. View daily, weekly, monthly, or yearly predictions.
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
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Language Selector */}
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-purple-400" />
                    <div className="flex rounded-lg border border-purple-500/30 overflow-hidden">
                      {QUESTIONNAIRE_LANGUAGES.map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setLanguage(lang)}
                          className={`px-3 py-2 text-sm font-medium transition-all ${
                            language === lang
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                              : 'bg-white/5 text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          {LANGUAGE_DISPLAY_LABELS[lang]}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Date Picker */}
                  <div className="flex items-center gap-2">
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
                      nepaliDate
                    />
                  </div>
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

      {/* Horoscopes Grid */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Spinner className="h-12 w-12 text-purple-400 mb-4" />
              <p className="text-gray-400">Loading horoscopes...</p>
            </div>
          )}

          {!isLoading && hasAnyData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {ZODIAC_SIGNS.map((sign) => {
                const prediction = horoscopesBySign.get(sign.value)?.prediction ?? '';
                const label = getRashiDisplayName(sign.value, language);

                return (
                  <div
                    key={sign.value}
                    className="group relative bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300"
                  >
                    {/* Decorative gradient orb */}
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
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!isLoading && !hasAnyData && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🌟</div>
              <h3 className="text-2xl font-bold text-white mb-2">No horoscope data available</h3>
              <p className="text-gray-400">
                Check back later for {category.toLowerCase()} horoscope predictions.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 border-t border-purple-500/20">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-red-500/10 border border-purple-500/30 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">Get Personalized Horoscope</h3>
            <p className="text-gray-300 mb-6">
              Sign in to set your rashi and receive personalized daily horoscope predictions tailored to your zodiac sign.
            </p>
            <a
              href="/auth/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
            >
              Sign In to Get Started
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
