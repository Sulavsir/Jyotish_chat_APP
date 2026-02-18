'use client';

import { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';

interface DashboardWelcomeSectionProps {
  userName: string | null | undefined;
  /** Primary actions (e.g. Request chat, Book appointment). */
  actions?: ReactNode;
}

export function DashboardWelcomeSection({ userName, actions }: DashboardWelcomeSectionProps) {
  const displayName = userName?.trim() || 'User';

  return (
    <div className="relative rounded-2xl overflow-hidden p-[1px] bg-gradient-to-r from-purple-500/40 via-indigo-500/30 to-amber-500/30">
      <div className="relative rounded-2xl bg-black/40 backdrop-blur-sm border border-white/10 p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-300 mb-2 lg:mb-3">
              <Sparkles className="h-3.5 w-3.5 text-purple-400 shrink-0" />
              <span>Your dashboard</span>
            </span>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white tracking-tight break-words">
              Welcome back, {displayName}
            </h1>
            <p className="mt-0.5 lg:mt-1 text-xs sm:text-sm text-gray-400 break-words">
              Explore your horoscope, chat with astrologers, or book a consultation.
            </p>
          </div>
          {actions && (
            <div className="flex flex-col sm:flex-row gap-2 lg:gap-3 flex-shrink-0 w-full lg:w-auto [&_button]:!h-9 [&_button]:!text-sm [&_button]:min-h-0 lg:[&_button]:!h-11 lg:[&_button]:!text-base">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
