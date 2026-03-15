/**
 * Nepali Date Service - English ↔ Bikram Sambat mapping from NepaliDate table
 */

import { prisma } from '@jyotish/database';
import type { AdMonthResponse, BsMonthResponse } from '../types/nepali-date.types';

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

/**
 * Get English date mapping for a single Nepali date (BS YYYY-MM-DD).
 * Returns null if not in range.
 */
export async function findByNepaliDate(nepaliDate: string): Promise<{
  englishDate: string;
  days: string;
} | null> {
  const normalized = nepaliDate.trim();
  if (!normalized) return null;

  const row = await prisma.nepaliDate.findFirst({
    where: { nepaliDate: normalized },
    select: { englishDate: true, days: true },
  });

  if (!row) return null;
  const englishKey = toDateKeyUTC(row.englishDate);
  return { englishDate: englishKey, days: row.days };
}

/**
 * Get English date mappings for multiple Nepali dates in one query.
 * Returns a record: nepaliDate (YYYY-MM-DD) -> { englishDate, days }.
 */
export async function findByNepaliDates(
  nepaliDates: string[]
): Promise<Record<string, { englishDate: string; days: string }>> {
  if (nepaliDates.length === 0) return {};

  const unique = [...new Set(nepaliDates.map((s) => s.trim()).filter(Boolean))];

  const rows = await prisma.nepaliDate.findMany({
    where: { nepaliDate: { in: unique } },
    select: { englishDate: true, nepaliDate: true, days: true },
  });

  const map: Record<string, { englishDate: string; days: string }> = {};
  for (const r of rows) {
    const englishKey = toDateKeyUTC(r.englishDate);
    map[r.nepaliDate] = { englishDate: englishKey, days: r.days };
  }
  return map;
}

/**
 * Get all days for an AD (English) month. No DB required.
 */
export function getAdMonth(year: number, month: number): AdMonthResponse {
  const days: { date: string; day: number }[] = [];
  const lastDay = new Date(year, month, 0).getDate();
  for (let day = 1; day <= lastDay; day++) {
    const m = String(month).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    days.push({ date: `${year}-${m}-${d}`, day });
  }
  return { year, month, days };
}

/**
 * Get all days for a BS (Nepali) month from the NepaliDate table.
 */
export async function getBsMonth(year: number, month: number): Promise<BsMonthResponse> {
  const monthStr = String(month).padStart(2, '0');
  const prefix = `${year}-${monthStr}-`;

  const rows = await prisma.nepaliDate.findMany({
    where: {
      nepaliDate: {
        startsWith: prefix,
      },
    },
    select: { nepaliDate: true, englishDate: true },
    orderBy: { nepaliDate: 'asc' },
  });

  const days = rows.map((r) => {
    const dayPart = r.nepaliDate.slice(-2);
    const day = Number.parseInt(dayPart, 10) || 0;
    return {
      nepaliDate: r.nepaliDate,
      englishDate: toDateKeyUTC(r.englishDate),
      day,
    };
  });

  return { year, month, days };
}
