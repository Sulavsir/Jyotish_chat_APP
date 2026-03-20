'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, Spinner, Button } from '@jyotish/ui';
import { Sun, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuestionnaireLanguageStore } from '@/store/questionnaire-language.store';
import { getRashiDisplayName } from '@jyotish/shared';
import { QUERY_KEYS, ROUTES } from '@/constants';
import { horoscopeService } from '@/services/horoscopeService';

interface DashboardRashiHoroscopeCardProps {
  userZodiacSign: string | null | undefined;
  /** When provided from dashboard stats, skip fetch and use this */
  horoscope?: { zodiacSign: string; prediction: string; category: string } | null;
  /** When true, show loading state (e.g. from stats loading) */
  isLoading?: boolean;
  className?: string;
}

/**
 * Shows user's daily horoscope for their rashi (from profile), or prompts to select rashi.
 * Purple/indigo tint to distinguish from Tip for today (orange). Side-by-side on dashboard.
 */
export function DashboardRashiHoroscopeCard({
  userZodiacSign,
  horoscope: horoscopeProp,
  isLoading: isLoadingProp,
  className,
}: DashboardRashiHoroscopeCardProps) {
  const router = useRouter();
  const language = useQuestionnaireLanguageStore((s) => s.language);

  const { data, isLoading: isQueryLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.HOROSCOPE.MY_HOROSCOPE(language),
    queryFn: () => horoscopeService.getMyHoroscope(language),
    staleTime: 5 * 60 * 1000,
    enabled: !!userZodiacSign && !horoscopeProp,
  });

  const horoscope = horoscopeProp ?? data?.horoscope;
  const isLoading = isLoadingProp ?? (!!userZodiacSign && !horoscopeProp && isQueryLoading);
  const rashiLabel = userZodiacSign ? getRashiDisplayName(userZodiacSign, language) : '';

  const cardClass = cn(
    'bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent border border-purple-500/20 rounded-xl overflow-hidden',
    className
  );

  if (!userZodiacSign) {
    return (
      <Card className={cardClass}>
        <CardContent className="p-4 md:p-5">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Sun className="h-5 w-5 text-purple-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Sparkles className="h-3.5 w-3.5" />
                Your horoscope
              </p>
              <p className="text-sm text-gray-400 mb-3">
                Select your rashi in Profile to see daily horoscope here.
              </p>
              <Button
                size="sm"
                onClick={() => router.push(ROUTES.PROFILE)}
                className="gap-2 border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 hover:text-purple-200"
              >
                <User className="h-4 w-4" />
                Select your rashi
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cardClass}>
      <CardContent className="p-4 md:p-5 bg-orange-400/10">
        <div className="flex gap-3 ">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Sun className="h-5 w-5 text-purple-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              {rashiLabel} – Today
            </p>
            {isLoading && (
              <div className="flex items-center gap-2 text-purple-300/80 text-sm">
                <Spinner className="h-4 w-4" />
                Loading...
              </div>
            )}
            {isError && <p className="text-sm text-gray-400">No horoscope available for today.</p>}
            {!isLoading && !isError && horoscope && (
              <p className="text-sm sm:text-[15px] text-blue-400 leading-relaxed break-words">
                {horoscope.prediction}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
