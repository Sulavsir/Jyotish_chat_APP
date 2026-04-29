import { ZodiacSign } from '../types';
import { ZODIAC_DATES } from '../constants';

export { canAcceptAppointments, canAcceptBroadcastMessages } from './astrologer.utils';
export {
  toApiLanguageCode,
  toDbLanguageCode,
  fromApiLanguageCode,
  fromDbLanguageCode,
  normalizeToDbLanguageCode,
  getLanguageDisplayName,
  type ApiLanguageCode,
  type DbLanguageCode,
} from './language.utils';

export { formatNepaliBsDateLine, type NepaliDateMappingInput } from './nepal-bs-date-display.utils';

export {
  mergeMessageBirthDetails,
  formatBirthDetailsSingleLine,
  groupMessagesBySenderAndSameSecond,
  type FallbackClientBirth,
  type MergedBirthDetails,
  type MessageWithSenderAndTime,
} from './chat-birth-metadata';

export {
  extractBareChatImageUrl,
  isBareChatImageMessageContent,
} from './chat-plain-image-url.utils';

export {
  isMaintenanceModeEnabled,
  buildMaintenanceApiErrorBody,
  type MaintenanceApiErrorBody,
} from './maintenance';

export {
  buildJyotishBookingLocationSummary,
  hasStructuredJyotishVenue,
  jyotishBookingVenueTitle,
  jyotishBookingVenuePrimaryLine,
  jyotishBookingVenueSecondaryLine,
} from './jyotish-booking.utils';

/**
 * Get zodiac sign from date of birth
 */
export function getZodiacSign(dateOfBirth: Date): ZodiacSign {
  const month = dateOfBirth.getMonth() + 1; // JavaScript months are 0-indexed
  const day = dateOfBirth.getDate();

  for (const [sign, dates] of Object.entries(ZODIAC_DATES)) {
    const { start, end } = dates;

    // Handle zodiac signs that span across year boundary (like Capricorn)
    if (start.month > end.month) {
      if (
        (month === start.month && day >= start.day) ||
        (month === end.month && day <= end.day) ||
        month > start.month ||
        month < end.month
      ) {
        return sign as ZodiacSign;
      }
    } else {
      if (
        (month === start.month && day >= start.day) ||
        (month === end.month && day <= end.day) ||
        (month > start.month && month < end.month)
      ) {
        return sign as ZodiacSign;
      }
    }
  }

  return ZodiacSign.ARIES; // Default fallback
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format time to HH:MM
 */
export function formatTime(date: Date): string {
  return date.toTimeString().split(' ')[0].slice(0, 5);
}

/**
 * Display a stored clock time (typically API / forms use 24-hour `HH:mm`) as 12-hour with AM/PM,
 * e.g. `16:15` → `4:15 PM`. Strings that already include AM/PM are returned trimmed. Unparseable
 * values are returned unchanged (trimmed).
 */
export function formatTimeStringAmPm(timeStr: string | null | undefined): string {
  if (timeStr == null || typeof timeStr !== 'string') return '';

  const trimmed = timeStr.trim();
  if (!trimmed) return '';

  if (/\b(am|pm)\b/i.test(trimmed)) return trimmed;

  const m = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (!m) return trimmed;

  const hour = Number.parseInt(m[1], 10);
  const minute = Number.parseInt(m[2], 10);

  if (
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return trimmed;
  }

  const isPm = hour >= 12;
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const minPadded = minute.toString().padStart(2, '0');
  const period = isPm ? 'PM' : 'AM';

  return `${hour12}:${minPadded} ${period}`;
}

/**
 * Format a Gregorian date (YYYY-MM-DD or ISO datetime) for English UI, e.g. Apr 14, 1999.
 * Parses YYYY-MM-DD in local calendar components so the day does not shift by timezone.
 */
export function formatGregorianDateEnShort(isoOrYmd: string | null | undefined): string {
  if (isoOrYmd == null || typeof isoOrYmd !== 'string') return '';

  const trimmed = isoOrYmd.trim();
  if (!trimmed) return '';

  const head = trimmed.includes('T') ? trimmed.slice(0, 10) : trimmed.slice(0, 10);
  const ymd = head.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) {
    const y = Number(ymd[1]);
    const mo = Number(ymd[2]);
    const day = Number(ymd[3]);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(day)) return trimmed;
    const d = new Date(y, mo - 1, day);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return trimmed;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Generate a random ID (fallback if UUID not available)
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Delay execution
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Get date range for horoscope category
 */
export function getDateRangeForCategory(
  category: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
  date: Date = new Date()
): { start: Date; end: Date } {
  const start = new Date(date);
  const end = new Date(date);

  switch (category) {
    case 'DAILY':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'WEEKLY':
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    case 'MONTHLY':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'YEARLY':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}

/**
 * Get canonical date for horoscope category (for DB storage and lookup).
 * One row per (zodiacSign, canonicalDate, category).
 */
export function getCanonicalDateForCategory(
  category: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
  date: Date = new Date()
): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  switch (category) {
    case 'DAILY':
      return d;
    case 'WEEKLY': {
      const dayOfWeek = d.getDay();
      d.setDate(d.getDate() - dayOfWeek);
      return d;
    }
    case 'MONTHLY':
      d.setDate(1);
      return d;
    case 'YEARLY':
      d.setMonth(0, 1);
      return d;
    default:
      return d;
  }
}
