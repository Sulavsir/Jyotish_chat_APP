/**
 * Horoscope Type Definitions
 */

import type { HoroscopeCategory, ZodiacSign } from '@jyotish/shared';

export interface HoroscopeData {
  zodiacSign: string;
  date: Date;
  prediction: string;
  category: HoroscopeCategory;
  love?: number;
  career?: number;
  health?: number;
  finance?: number;
}

export interface SubscriptionData {
  userId: string;
  frequency?: SubscriptionFrequency;
  deliveryTime?: string;
}

export type SubscriptionFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';
