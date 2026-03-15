/**
 * Nepali date API types - AD/BS month responses (align with backend)
 */

export interface AdMonthDay {
  date: string;
  day: number;
}

export interface AdMonthResponse {
  year: number;
  month: number;
  days: AdMonthDay[];
}

export interface BsMonthDay {
  nepaliDate: string;
  englishDate: string;
  day: number;
}

export interface BsMonthResponse {
  year: number;
  month: number;
  days: BsMonthDay[];
}
