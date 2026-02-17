/**
 * Horoscope UI constants - Rashi (zodiac) display names and icons
 */

import { HoroscopeCategory } from '@jyotish/shared';

export const ZODIAC_SIGNS = [
  { value: 'ARIES', name: 'Aries', icon: '♈' },
  { value: 'TAURUS', name: 'Taurus', icon: '♉' },
  { value: 'GEMINI', name: 'Gemini', icon: '♊' },
  { value: 'CANCER', name: 'Cancer', icon: '♋' },
  { value: 'LEO', name: 'Leo', icon: '♌' },
  { value: 'VIRGO', name: 'Virgo', icon: '♍' },
  { value: 'LIBRA', name: 'Libra', icon: '♎' },
  { value: 'SCORPIO', name: 'Scorpio', icon: '♏' },
  { value: 'SAGITTARIUS', name: 'Sagittarius', icon: '♐' },
  { value: 'CAPRICORN', name: 'Capricorn', icon: '♑' },
  { value: 'AQUARIUS', name: 'Aquarius', icon: '♒' },
  { value: 'PISCES', name: 'Pisces', icon: '♓' },
] as const;

export const HOROSCOPE_CATEGORIES: { value: HoroscopeCategory; label: string }[] = [
  { value: HoroscopeCategory.DAILY, label: 'Daily' },
  { value: HoroscopeCategory.WEEKLY, label: 'Weekly' },
  { value: HoroscopeCategory.MONTHLY, label: 'Monthly' },
  { value: HoroscopeCategory.YEARLY, label: 'Yearly' },
];
