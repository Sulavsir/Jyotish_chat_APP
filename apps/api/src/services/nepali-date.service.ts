/**
 * Nepali Date Service - English ↔ Bikram Sambat mapping from NepaliDate table
 */

import { prisma } from '@jyotish/database';

function toDateOnly(isoOrDate: string | Date): Date {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toDateKeyUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Get Nepali date mapping for a single English date (date-only, no time).
 * Returns null if not in range.
 */
export async function findByEnglishDate(englishDate: string | Date): Promise<{
  nepaliDate: string;
  days: string;
} | null> {
  const dateOnly = toDateOnly(englishDate);

  const row = await prisma.nepaliDate.findFirst({
    where: {
      englishDate: dateOnly,
    },
    select: { nepaliDate: true, days: true },
  });

  return row ? { nepaliDate: row.nepaliDate, days: row.days } : null;
}

/**
 * Get Nepali date mappings for multiple English dates in one query.
 * Returns a record: englishDate (YYYY-MM-DD) -> { nepaliDate, days }.
 */
export async function findByEnglishDates(
  englishDates: (string | Date)[]
): Promise<Record<string, { nepaliDate: string; days: string }>> {
  if (englishDates.length === 0) return {};

  const normalized = englishDates.map((d) => toDateOnly(d));
  const uniqueKeys = [...new Set(normalized.map(toDateKey))];
  const uniqueDates = uniqueKeys.map((s) => new Date(s));

  const rows = await prisma.nepaliDate.findMany({
    where: {
      englishDate: {
        in: uniqueDates,
      },
    },
    select: { englishDate: true, nepaliDate: true, days: true },
  });

  const map: Record<string, { nepaliDate: string; days: string }> = {};
  for (const r of rows) {
    const key = toDateKeyUTC(r.englishDate);
    map[key] = { nepaliDate: r.nepaliDate, days: r.days };
  }
  return map;
}
