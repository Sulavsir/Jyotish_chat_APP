'use client';

import React, { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { getRashiDisplayName } from '@jyotish/shared';
import { horoscopeService } from '@/services/horoscopeService';
import { QUERY_KEYS } from '@/constants';
import { ZODIAC_SIGNS } from '@/constants/horoscope.constants';
import { Spinner } from '@jyotish/ui';

const PUBLIC_HOROSCOPE_LANGUAGE = 'ENGLISH';

/**
 * Public (no auth) view of today's horoscope for all 12 rashis.
 * Read-only: no rashi selection, just display.
 */
export function PublicTodayRashifal() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const queries = useQueries({
    queries: ZODIAC_SIGNS.map((sign) => ({
      queryKey: QUERY_KEYS.HOROSCOPE.GET(sign.value, 'DAILY', today, PUBLIC_HOROSCOPE_LANGUAGE),
      queryFn: () =>
        horoscopeService.getHoroscope({
          zodiacSign: sign.value,
          category: 'DAILY',
          date: today,
          language: PUBLIC_HOROSCOPE_LANGUAGE,
        }),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const hasData = queries.some((q) => q.data?.horoscope?.prediction);

  return (
    <div className="mt-16 pt-16 border-t border-purple-500/20">
      <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 text-center">
        Today&apos;s Rashifal
      </h3>
      <p className="text-gray-400 text-center mb-8 max-w-xl mx-auto">
        Daily horoscope for all rashis. Sign in to get a personalized view and set your rashi.
      </p>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner className="h-8 w-8 text-purple-400" />
        </div>
      )}

      {!isLoading && hasData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ZODIAC_SIGNS.map((sign, i) => {
            const { data, isFetching } = queries[i] ?? {};
            const prediction = data?.horoscope?.prediction ?? '';
            const label = getRashiDisplayName(sign.value, PUBLIC_HOROSCOPE_LANGUAGE);

            return (
              <div
                key={sign.value}
                className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-purple-500/20 hover:border-purple-500/40 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl" aria-hidden>
                    {sign.icon}
                  </span>
                  <span className="font-semibold text-white">{label}</span>
                </div>
                {isFetching ? (
                  <p className="text-sm text-gray-500">Loading...</p>
                ) : (
                  <p className="text-sm text-gray-300 leading-relaxed line-clamp-4">
                    {prediction || 'No horoscope available for today.'}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && !hasData && (
        <p className="text-center text-gray-400 py-8">No horoscope data available for today.</p>
      )}
    </div>
  );
}
