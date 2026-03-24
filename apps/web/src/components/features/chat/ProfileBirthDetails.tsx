/**
 * ProfileBirthDetails - Displays DOB, TOB, POB with English + Nepali (BS) dates
 * Used under client messages in chat when astrologer is viewing
 */

import React, { useMemo } from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { useBirthDetailsNepaliDate } from '@/hooks/useBirthDetailsNepaliDate';
import type { NepaliDateMapping } from '@/services/nepali-date.service';
import { formatTimeAmPm, toDateKey, formatNepaliDateCompact } from '@/utils/date-format.utils';
import type { MessageBirthDetails } from '@/types/chat';

export interface ProfileBirthDetailsProps {
  /** Birth details (from message metadata or sender) */
  birthDetails: MessageBirthDetails;
  /** Visual variant */
  variant?: 'default' | 'jyotish';
  /** Optional loading state override */
  isLoading?: boolean;
  /**
   * When set (astrologer chat), Nepali line uses this map from a single batched /convert
   * for the thread instead of per-row requests.
   */
  nepaliBatch?: {
    map: Record<string, NepaliDateMapping> | null;
    isLoading: boolean;
  };
}

const NOT_PROVIDED = 'Not provided';

export const ProfileBirthDetails: React.FC<ProfileBirthDetailsProps> = ({
  birthDetails,
  variant: _variant = 'default',
  nepaliBatch,
}) => {
  const { dateOfBirth, timeOfBirth, placeOfBirth } = birthDetails;

  const useBatch = nepaliBatch !== undefined;

  const dateStr = useMemo(() => {
    if (!dateOfBirth) return null;
    return typeof dateOfBirth === 'string'
      ? dateOfBirth
      : dateOfBirth instanceof Date
        ? dateOfBirth.toISOString().slice(0, 10)
        : null;
  }, [dateOfBirth]);

  const dateKey = useMemo(() => (dateStr ? toDateKey(dateStr) : null), [dateStr]);

  const hookResult = useBirthDetailsNepaliDate(dateOfBirth, { skipNepaliApi: useBatch });

  const nepaliDisplay = useMemo(() => {
    if (useBatch && nepaliBatch && dateKey) {
      const mapping = nepaliBatch.map?.[dateKey];
      return mapping ? formatNepaliDateCompact(mapping, true) : null;
    }
    return hookResult.nepaliDisplay;
  }, [useBatch, nepaliBatch, dateKey, hookResult.nepaliDisplay]);

  const englishDisplay = hookResult.englishDisplay;
  const isNepaliLoading = useBatch ? nepaliBatch!.isLoading : hookResult.isLoading;

  const hasDob = !!dateOfBirth;
  const hasTob = !!timeOfBirth?.trim();
  const hasPob = !!placeOfBirth?.trim();
  const hasAny = hasDob || hasTob || hasPob;

  if (!hasAny) return null;

  const containerClass =
    'mt-2 px-3 py-2 rounded-lg text-xs bg-blue-50/80 border border-blue-200/50';
  const rowClass = 'flex items-center gap-1.5 text-blue-900';
  const iconClass = 'h-3 w-3 flex-shrink-0 text-blue-600';

  return (
    <div className={containerClass}>
      <div className="grid grid-cols-1 gap-1.5">
        {hasDob && (
          <div className={rowClass}>
            <Calendar className={iconClass} />
            <span className="font-medium">DOB:</span>
            <span>
              {isNepaliLoading ? (
                <span className="text-blue-600">Loading...</span>
              ) : nepaliDisplay ? (
                <>
                  {englishDisplay} / {nepaliDisplay}
                </>
              ) : (
                englishDisplay || NOT_PROVIDED
              )}
            </span>
          </div>
        )}
        {hasTob && (
          <div className={rowClass}>
            <Clock className={iconClass} />
            <span className="font-medium">TOB:</span>
            <span>{formatTimeAmPm(timeOfBirth ?? '')}</span>
          </div>
        )}
        {hasPob && (
          <div className={rowClass}>
            <MapPin className={iconClass} />
            <span className="font-medium">POB:</span>
            <span className="truncate">{placeOfBirth}</span>
          </div>
        )}
      </div>
    </div>
  );
};
