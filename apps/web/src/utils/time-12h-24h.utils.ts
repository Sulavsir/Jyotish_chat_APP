/**
 * UI-only helpers: show 12-hour AM/PM while preserving API/storage as "HH:mm" (24-hour).
 */

const TIME_24_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export type AmPm = 'AM' | 'PM';

export interface TimeOfBirth12hParts {
  hour12: number;
  minute: number;
  period: AmPm;
}

/**
 * Parse a 24h "HH:mm" string into 12h parts. Returns null if empty or invalid.
 */
export function parseTwentyFourHourTimeToParts(time: string): TimeOfBirth12hParts | null {
  const trimmed = time.trim();
  if (!trimmed) return null;
  const m = trimmed.match(TIME_24_RE);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const minute = parseInt(m[2], 10);
  if (h > 23 || minute > 59) return null;

  const period: AmPm = h >= 12 ? 'PM' : 'AM';
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;

  return { hour12, minute, period };
}

/**
 * Build canonical "HH:mm" (24h) from 12h parts.
 */
export function formatTwentyFourHourFromParts(
  hour12: number,
  minute: number,
  period: AmPm
): string {
  let h24: number;
  if (period === 'AM') {
    h24 = hour12 === 12 ? 0 : hour12;
  } else {
    h24 = hour12 === 12 ? 12 : hour12 + 12;
  }
  return `${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
