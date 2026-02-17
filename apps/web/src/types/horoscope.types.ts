/**
 * Horoscope types - API response and client usage
 */

import type { HoroscopeCategory } from '@jyotish/shared';

/** Horoscope as returned by GET /horoscopes/daily|weekly|monthly|yearly/:zodiacSign */
export interface HoroscopeResponse {
  zodiacSign: string;
  date: string;
  prediction: string;
  category: HoroscopeCategory;
}

export type { HoroscopeCategory } from '@jyotish/shared';
