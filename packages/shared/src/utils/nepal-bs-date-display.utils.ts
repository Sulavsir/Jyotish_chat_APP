/**
 * Bikram Sambat date display (shared) for web, admin, etc.
 */

export interface NepaliDateMappingInput {
  nepaliDate: string;
  days: string;
}

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

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
const NEPALI_WEEKDAY_LABELS = [
  'आइतबार',
  'सोमबार',
  'मंगलबार',
  'बुधबार',
  'बिहीबार',
  'शुक्रबार',
  'शनिबार',
] as const;
const NEPALI_WEEKDAY_MAP: Record<string, string> = Object.fromEntries(
  DAY_KEYS.map((key, i) => [key, NEPALI_WEEKDAY_LABELS[i]])
) as Record<string, string>;

function getOrdinalSuffix(n: number): string {
  if (n >= 11 && n <= 13) return 'th';
  const last = n % 10;
  if (last === 1) return 'st';
  if (last === 2) return 'nd';
  if (last === 3) return 'rd';
  return 'th';
}

function getNepaliMonthName(month: number): string {
  if (!Number.isInteger(month) || month < 1 || month > 12) return '';
  return BS_MONTH_NAMES[month] ?? '';
}

function getNepaliWeekdayLabel(englishDay: string): string {
  if (!englishDay) return '';
  const trimmed = englishDay.trim();
  const key = trimmed.toLowerCase().slice(0, 3);
  return NEPALI_WEEKDAY_MAP[key] ?? trimmed;
}

/**
 * e.g. "12th Falgun 2082 (आइतबार)" — same style as the web app booking flows.
 */
export function formatNepaliBsDateLine(mapping: NepaliDateMappingInput | null | undefined): string {
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
