import { addDays } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

export const REPORTING_TIME_ZONE = 'Asia/Kathmandu' as const;

export type ReportingYmd = `${number}-${number}-${number}`;

const GREGORIAN_YMD_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Gregorian wall-calendar date → `Date` at **UTC midnight** for Postgres `DATE` / Prisma `@db.Date`.
 *
 * Use this when the API sends `YYYY-MM-DD` as a plain civil date (Subha Sahit, etc.). Do **not** use
 * {@link reportingDayStart} for that case: Kathmandu start-of-day is the *previous* UTC date, so
 * `@db.Date` truncates to the wrong day (e.g. May 14 → May 13).
 */
export function utcDateFromGregorianYmd(ymd: ReportingYmd | string): Date {
  const m = GREGORIAN_YMD_RE.exec(String(ymd).trim());
  if (!m) {
    throw new RangeError(`Invalid Gregorian YYYY-MM-DD: ${ymd}`);
  }
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) {
    throw new RangeError(`Invalid Gregorian YYYY-MM-DD: ${ymd}`);
  }
  return new Date(Date.UTC(y, mo - 1, d));
}

/**
 * Returns YYYY-MM-DD for the reporting timezone.
 * Use this instead of `new Date(); setHours(0,0,0,0)` to avoid UTC/local mismatches.
 */
export function getReportingYmd(now: Date = new Date()): ReportingYmd {
  return formatInTimeZone(now, REPORTING_TIME_ZONE, 'yyyy-MM-dd') as ReportingYmd;
}

/** Start of reporting day (00:00:00.000) in reporting timezone, returned as UTC Date. */
export function reportingDayStart(ymd: ReportingYmd): Date {
  return fromZonedTime(`${ymd}T00:00:00.000`, REPORTING_TIME_ZONE);
}

/** Inclusive end of reporting day (23:59:59.999) in reporting timezone, returned as UTC Date. */
export function reportingDayEndInclusive(ymd: ReportingYmd): Date {
  return fromZonedTime(`${ymd}T23:59:59.999`, REPORTING_TIME_ZONE);
}

/** Add N reporting days to a YYYY-MM-DD (reporting timezone) and return YYYY-MM-DD. */
export function addReportingDaysYmd(ymd: ReportingYmd, days: number): ReportingYmd {
  // Use a safe midday anchor in the reporting timezone, then add days in UTC and re-format in TZ.
  const utcMidday = fromZonedTime(`${ymd}T12:00:00.000`, REPORTING_TIME_ZONE);
  const next = addDays(utcMidday, days);
  return formatInTimeZone(next, REPORTING_TIME_ZONE, 'yyyy-MM-dd') as ReportingYmd;
}

