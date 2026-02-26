/**
 * Date formatting utilities - English and Nepali (Bikram Sambat) display
 */

import type { NepaliDateMapping } from '@/services/nepali-date.service';

const NEPALI_WEEKDAY_MAP: Record<string, string> = {
  sun: 'आइतबार',
  mon: 'सोमबार',
  tue: 'मंगलबार',
  wed: 'बुधबार',
  thu: 'बिहीबार',
  fri: 'शुक्रबार',
  sat: 'शनिबार',
};

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
 */
export function toDateKey(dateStr: string): string {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toISOString().slice(0, 10);
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
