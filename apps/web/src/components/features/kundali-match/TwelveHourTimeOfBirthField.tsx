'use client';

import { useEffect, useState } from 'react';
import { Label } from '@jyotish/ui';
import { cn } from '@/lib/utils';
import {
  formatTwentyFourHourFromParts,
  parseTwentyFourHourTimeToParts,
  type AmPm,
} from '@/utils/time-12h-24h.utils';

const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);

const selectClassName = cn(
  'h-11 w-full min-w-0 rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white',
  'focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

type LocalParts = { hour: string; minute: string; period: string };

/** Default period is AM so the control never shows an empty “—” state. */
const emptyLocal: LocalParts = { hour: '', minute: '', period: 'AM' };

function localToPayload(parts: LocalParts): string {
  const { hour, minute, period } = parts;
  if (!hour || minute === '') return '';
  if (period !== 'AM' && period !== 'PM') return '';
  const hi = parseInt(hour, 10);
  const mi = parseInt(minute, 10);
  if (hi < 1 || hi > 12 || mi < 0 || mi > 59) return '';
  return formatTwentyFourHourFromParts(hi, mi, period as AmPm);
}

export interface TwelveHourTimeOfBirthFieldProps {
  /** Stored / API value: "HH:mm" 24-hour or empty — unchanged on the wire. */
  value: string;
  onChange: (value24: string) => void;
  label: string;
  disabled?: boolean;
  id?: string;
  /** Only sync dropdowns from `value` while the modal is open (avoids resetting after close). */
  isModalOpen: boolean;
}

/**
 * Hour (1–12), minute, AM/PM for display. Emits the same canonical 24h "HH:mm" as before.
 */
export function TwelveHourTimeOfBirthField({
  value,
  onChange,
  label,
  disabled,
  id,
  isModalOpen,
}: TwelveHourTimeOfBirthFieldProps) {
  const [local, setLocal] = useState<LocalParts>(emptyLocal);

  useEffect(() => {
    if (!isModalOpen) return;
    const parsed = parseTwentyFourHourTimeToParts(value);
    if (!parsed) {
      setLocal(emptyLocal);
      return;
    }
    setLocal({
      hour: String(parsed.hour12),
      minute: String(parsed.minute).padStart(2, '0'),
      period: parsed.period,
    });
  }, [isModalOpen, value]);

  const patch = (field: keyof LocalParts, val: string) => {
    setLocal((prev) => {
      const next = { ...prev, [field]: val };
      onChange(localToPayload(next));
      return next;
    });
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-white/80 text-xs" htmlFor={id}>
        {label}
      </Label>
      <div className="flex flex-wrap items-stretch gap-2 sm:flex-nowrap">
        <div className="min-w-[4.5rem] flex-1 sm:flex-initial sm:w-[4.75rem]">
          <label htmlFor={id ? `${id}-hour` : undefined} className="sr-only">
            {label} — hour
          </label>
          <select
            id={id ? `${id}-hour` : undefined}
            className={selectClassName}
            value={local.hour}
            disabled={disabled}
            onChange={(e) => patch('hour', e.target.value)}
            aria-label={`${label} hour (1–12)`}
          >
            <option value="">Hr</option>
            {HOURS_12.map((h) => (
              <option key={h} value={String(h)}>
                {h}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[4.5rem] flex-1 sm:flex-initial sm:w-[4.75rem]">
          <label htmlFor={id ? `${id}-min` : undefined} className="sr-only">
            {label} — minute
          </label>
          <select
            id={id ? `${id}-min` : undefined}
            className={selectClassName}
            value={local.minute}
            disabled={disabled}
            onChange={(e) => patch('minute', e.target.value)}
            aria-label={`${label} minute`}
          >
            <option value="">Min</option>
            {MINUTES.map((m) => {
              const v = String(m).padStart(2, '0');
              return (
                <option key={m} value={v}>
                  {v}
                </option>
              );
            })}
          </select>
        </div>
        <div className="min-w-[5rem] flex-1 sm:flex-initial sm:w-[5.5rem]">
          <label htmlFor={id ? `${id}-ap` : undefined} className="sr-only">
            {label} — AM or PM
          </label>
          <select
            id={id ? `${id}-ap` : undefined}
            className={selectClassName}
            value={local.period}
            disabled={disabled}
            onChange={(e) => patch('period', e.target.value)}
            aria-label={`${label} AM or PM`}
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
      </div>
    </div>
  );
}
