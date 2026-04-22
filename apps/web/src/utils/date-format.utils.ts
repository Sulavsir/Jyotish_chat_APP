/**
 * Date formatting utilities - English and Nepali (Bikram Sambat) display
 */

import type { NepaliDateMapping } from '@/services/nepali-date.service';
import { formatTimeStringAmPm } from '@jyotish/shared';
import { NEPALI_WEEKDAY_LABELS } from '@jyotish/ui';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
const NEPALI_WEEKDAY_MAP: Record<string, string> = Object.fromEntries(
  DAY_KEYS.map((key, i) => [key, NEPALI_WEEKDAY_LABELS[i]])
) as Record<string, string>;

const BS_MONTH_NAMES: string[] = [
  '',
  'Baisakh',
  'Jestha',
  'Ashadh',
  'Shrawan',
  'Bhadra',
  'Ashwin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
];

function getOrdinalSuffix(n: number): string {
  if (n >= 11 && n <= 13) return 'th';
  const last = n % 10;
  if (last === 1) return 'st';
  if (last === 2) return 'nd';
  if (last === 3) return 'rd';
  return 'th';
}

/**
 * Map English weekday (Sun/Mon/Tuesday) to Nepali label.
 */
export function getNepaliWeekdayLabel(englishDay: string): string {
  if (!englishDay) return '';
  const trimmed = englishDay.trim();
  const key = trimmed.toLowerCase().slice(0, 3);
  return NEPALI_WEEKDAY_MAP[key] ?? trimmed;
}

/**
 * Get Nepali Bikram Sambat month name from month number (1-12).
 */
export function getNepaliMonthName(month: number): string {
  if (!Number.isInteger(month) || month < 1 || month > 12) return '';
  return BS_MONTH_NAMES[month] ?? '';
}

/**
 * Normalize date string to YYYY-MM-DD for API lookup.
 * Uses date components only to avoid timezone shifts (e.g. "2024-03-06T00:00:00"
 * in Nepal would become 2024-03-05 with toISOString due to UTC conversion).
 */
export function toDateKey(dateStr: string): string {
  if (!dateStr || typeof dateStr !== 'string') return '';
  // Extract YYYY-MM-DD directly if present (avoids timezone issues)
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  // Use UTC date for non-ISO inputs to be consistent
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Format English date for display: "24th February 2026"
 */
export function formatEnglishDate(dateStr: string): string {
  if (!dateStr || typeof dateStr !== 'string') return '';

  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;

  const day = d.getDate();
  const monthName = d.toLocaleString('en-US', { month: 'long' });
  const year = d.getFullYear();
  return `${day}${getOrdinalSuffix(day)} ${monthName} ${year}`;
}

/**
 * Format English date short for compact display: "06 Mar, 2024" or "06 Mar, 2024 (Wednesday)"
 */
export function formatEnglishDateShort(dateStr: string, includeWeekday = false): string {
  if (!dateStr || typeof dateStr !== 'string') return '';

  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;

  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year = d.getFullYear();
  const base = `${day} ${month}, ${year}`;
  if (includeWeekday) {
    const weekday = d.toLocaleString('en-US', { weekday: 'long' });
    return `${base} (${weekday})`;
  }
  return base;
}

/**
 * Format Nepali (Bikram Sambat) date for display.
 * Example: "12th Falgun 2082 (आइतबार)"
 */
export function formatNepaliDateDisplay(mapping: NepaliDateMapping): string {
  if (!mapping?.nepaliDate) return '';

  const [yearStr, monthStr, dayStr] = mapping.nepaliDate.split('-');
  const year = Number.parseInt(yearStr, 10);
  const month = Number.parseInt(monthStr, 10);
  const day = Number.parseInt(dayStr, 10);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    const weekday = mapping.days ? getNepaliWeekdayLabel(mapping.days) : '';
    const dayPart = weekday ? ` (${weekday})` : '';
    return `${mapping.nepaliDate}${dayPart}`;
  }

  const monthName = getNepaliMonthName(month) || monthStr;
  const ordinalSuffix = getOrdinalSuffix(day);
  const weekday = mapping.days ? getNepaliWeekdayLabel(mapping.days) : '';
  const dayPart = weekday ? ` (${weekday})` : '';

  return `${day}${ordinalSuffix} ${monthName} ${year}${dayPart}`;
}

/**
 * Format 24-hour time with AM/PM (delegates to shared helper).
 */
export function formatTimeAmPm(timeStr: string): string {
  return formatTimeStringAmPm(timeStr);
}

/**
 * Nepali Date Conversion Format
 */
export function formatNepaliDateCompact(
  mapping: NepaliDateMapping,
  includeWeekday = false
): string {
  if (!mapping?.nepaliDate) return '';

  const [yearStr, monthStr, dayStr] = mapping.nepaliDate.split('-');
  const year = Number.parseInt(yearStr, 10);
  const month = Number.parseInt(monthStr, 10);
  const day = Number.parseInt(dayStr, 10);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    const weekday = includeWeekday && mapping.days ? getNepaliWeekdayLabel(mapping.days) : '';
    return weekday ? `${mapping.nepaliDate} (${weekday})` : mapping.nepaliDate;
  }

  const monthName = getNepaliMonthName(month) || monthStr;
  const base = `${day} ${monthName} ${year}`;
  if (includeWeekday && mapping.days) {
    const weekday = getNepaliWeekdayLabel(mapping.days);
    return `${base} (${weekday})`;
  }
  return base;
}
