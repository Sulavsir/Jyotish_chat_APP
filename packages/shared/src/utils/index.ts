import { ZodiacSign } from '../types';
import { ZODIAC_DATES } from '../constants';

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
