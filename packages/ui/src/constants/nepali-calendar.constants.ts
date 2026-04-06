export const AD_YEAR_MIN = 1944;
export const AD_YEAR_MAX = 2030;

export const BS_YEAR_MIN = 1970;
export const BS_YEAR_MAX = 2090;

/** Fallback path when app does not provide getBsMonth via NepaliDateApiProvider */
export const BS_MONTH_API_PATH = '/api/v1/public/nepali-date/bs-month';

/** Fallback path to convert English (AD) date -> Nepali (BS) date */
export const NEPALI_BY_ENGLISH_DATE_API_PATH = '/api/v1/public/nepali-date';

export const BS_MONTH_NAMES = [
  '',
  'Baisakh',
  'Jestha',
  'Ashadh',
  'Shrawan',
  'Bhadra',
  'Ashwin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
] as const;

