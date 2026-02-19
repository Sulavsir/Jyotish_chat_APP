'use client';

import { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';

interface DashboardWelcomeSectionProps {
  userName: string | null | undefined;
  /** Primary actions (e.g. Request chat, Book appointment). */
  actions?: ReactNode;
}

export function DashboardWelcomeSection({ userName, actions }: DashboardWelcomeSectionProps) {
  const { t } = useTranslations();
  const displayName = userName?.trim() || 'User';

  return (
    <div className="relative rounded-2xl overflow-hidden p-[1px] bg-gradient-to-r from-purple-500/40 via-indigo-500/30 to-amber-500/30">
      <div className="relative rounded-2xl bg-black/40 backdrop-blur-sm border border-white/10 p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div className="min-w-0 flex-1">
            {/* Space / stars layer */}
            <div className="pointer-events-none absolute inset-0">
              {/* Denser background stars */}
              <div className="stars" />
              <span className="spark spark--1" />
              <span className="spark spark--2" />
              <span className="spark spark--3" />
              <span className="spark spark--4" />
              <span className="spark spark--5" />
              <span className="spark spark--6" />
              <span className="spark spark--7" />
              <span className="spark spark--8" />
              <span className="spark spark--9" />
              <span className="spark spark--10" />
              <span className="spark spark--11" />
              <span className="spark spark--12" />
              <span className="spark spark--13" />
              <span className="spark spark--14" />
              <span className="spark spark--15" />
              <span className="spark spark--16" />
              <span className="spark spark--17" />
              <span className="spark spark--18" />
              <span className="spark spark--19" />
              <span className="spark spark--20" />
              <span className="spark spark--21" />
              <span className="spark spark--22" />
              <span className="spark spark--23" />
              <span className="spark spark--24" />
              <span className="spark spark--25" />
              <span className="spark spark--26" />
              <span className="spark spark--27" />
              <span className="spark spark--28" />
              <span className="spark spark--29" />
              <span className="spark spark--30" />
              <span className="spark spark--31" />
              <span className="spark spark--32" />
              <span className="spark spark--33" />
              <span className="spark spark--34" />
              <span className="spark spark--35" />
              <span className="spark spark--36" />
              <span className="spark spark--37" />
              <span className="spark spark--38" />
              <span className="meteor meteor--1 motion-safe:block hidden sm:block" />
              <span className="meteor meteor--2 motion-safe:block hidden sm:block" />
              <span className="meteor meteor--3 motion-safe:block hidden sm:block" />
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-300 mb-2 lg:mb-3">
              <Sparkles className="h-3.5 w-3.5 text-purple-400 shrink-0" />
              <span>{t('yourDashboard')}</span>
            </span>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white tracking-tight break-words">
              {t('welcomeBack', { name: displayName })}
            </h1>
            <p className="mt-0.5 lg:mt-1 text-xs sm:text-sm text-gray-400 break-words">
              {t('exploreHoroscope')}
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
