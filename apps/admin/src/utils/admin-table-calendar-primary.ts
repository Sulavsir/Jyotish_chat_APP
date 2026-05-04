export type AdminTableCalendarPrimary = 'english' | 'nepali';

/**
 * Derive table date emphasis from list language filter.
 * Empty filter → English-primary (dual-line still shows BS below).
 */
export function calendarPrimaryFromAdminLanguageFilter(filter: string): AdminTableCalendarPrimary {
  const u = filter.trim().toUpperCase();
  if (u === 'NEPALI' || u === 'NE' || u === 'HINDI' || u === 'HI') return 'nepali';
  return 'english';
}
