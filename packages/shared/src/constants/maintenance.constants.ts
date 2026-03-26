/**
 * Maintenance mode – shared by API, Next.js apps, and Flutter.
 */

export const MAINTENANCE_MODE_ENV = 'MAINTENANCE_MODE' as const;

export const MAINTENANCE_MODE_PUBLIC_ENV = 'NEXT_PUBLIC_MAINTENANCE_MODE' as const;

export const MAINTENANCE_PAGE_PATH = '/maintenance' as const;

export const MAINTENANCE_ERROR_CODE = 'MAINTENANCE_MODE' as const;

export const MAINTENANCE_MESSAGES = {
  eyebrow: 'Scheduled maintenance',
  title: 'We’ll be back soon',
  lead: 'Our servers are temporarily unavailable while we complete an update. Please try again in a little while.',
  hint: 'Most maintenance finishes within a few minutes, but it can sometimes take a few hours. Thank you for your patience.',
  short: 'Service temporarily unavailable due to maintenance.',
} as const;
