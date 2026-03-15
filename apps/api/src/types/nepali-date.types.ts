/**
 * Nepali Date API types - request/response for convert and get endpoints
 */

export interface NepaliDateMapping {
  nepaliDate: string;
  days: string;
}

export interface NepaliToEnglishMapping {
  englishDate: string;
  days: string;
}

export interface ConvertNepaliDatesRequestBody {
  dates?: string[];
  nepaliDates?: string[];
}

export interface ConvertNepaliDatesResponse {
  map?: Record<string, NepaliDateMapping>;
  mapNepaliToEnglish?: Record<string, NepaliToEnglishMapping>;
}

/** AD (English) month API: one day entry */
export interface AdMonthDay {
  date: string; // YYYY-MM-DD
  day: number; // 1-31
}

/** AD month API response: all days for a given English year+month */
export interface AdMonthResponse {
  year: number;
  month: number;
  days: AdMonthDay[];
}

/** BS (Nepali) month API: one day entry with English equivalent */
export interface BsMonthDay {
  nepaliDate: string; // YYYY-MM-DD (BS)
  englishDate: string; // YYYY-MM-DD (AD)
  day: number; // 1-30/31
}

/** BS month API response: all days for a given BS year+month */
export interface BsMonthResponse {
  year: number; // BS year
  month: number; // BS month 1-12
  days: BsMonthDay[];
}
