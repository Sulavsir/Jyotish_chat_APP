'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, Spinner } from '@jyotish/ui';
import { Lightbulb, Sparkles } from 'lucide-react';
import type { TipAudience } from '@jyotish/shared';
import { cn } from '@/lib/utils';
import { useQuestionnaireLanguageStore } from '@/store/questionnaire-language.store';
import { QUERY_KEYS } from '@/constants';
import { tipService } from '@/services/tip.service';

// Fallback tips (used only when API has no data)
const FALLBACK_TIPS = [
  'आज ग्राहकको जन्म मिति, समय र स्थान ध्यानपूर्वक पुष्टि गरेर मात्र कुण्डली विश्लेषण सुरु गर्नुहोस्।',
  'ग्राहकसँग नम्र भाषा प्रयोग गर्नुहोस् — सकारात्मक ऊर्जा नै सफल ज्योतिषको आधार हो।',
  'ग्राहकलाई डर होइन, मार्गदर्शन दिनुहोस् — ज्योतिषको उद्देश्य समाधान देखाउनु हो।',
  'समयमै जवाफ दिनुहोस्, ढिलो प्रतिक्रिया ग्राहक गुमाउने कारण बन्न सक्छ।',
];

interface DashboardTipProps {
  audience?: TipAudience; // 'JYOTISH' | 'CLIENT'
  className?: string;
}

export function DashboardTip({ audience = 'JYOTISH', className }: DashboardTipProps) {
  const language = useQuestionnaireLanguageStore((s) => s.language);

  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.TIPS.TODAY(audience, language),
    queryFn: () => tipService.getTodayTips(audience, language),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const apiTip = data?.tips?.[0]?.text;
  const fallbackTip =
    !apiTip && !isError ? FALLBACK_TIPS[new Date().getDate() % FALLBACK_TIPS.length] : undefined;
  const tipText = apiTip || fallbackTip;

  if (!tipText && isError) {
    return null;
  }

  return (
    <Card className={cn('bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 rounded-xl overflow-hidden', className)}>
      <CardContent className="p-4 md:p-5">
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Lightbulb className="h-5 w-5 text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              Tip for today
            </p>
            {isLoading ? (
              <div className="flex items-center gap-2 text-amber-300/80 text-sm">
                <Spinner className="h-4 w-4" />
                Loading daily tip...
              </div>
            ) : (
              <p className="text-sm sm:text-[15px] text-indigo-400 leading-relaxed break-words">
                {tipText}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
