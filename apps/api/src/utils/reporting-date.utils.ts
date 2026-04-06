import { addDays } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

export const REPORTING_TIME_ZONE = 'Asia/Kathmandu' as const;

export type ReportingYmd = `${number}-${number}-${number}`;

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

