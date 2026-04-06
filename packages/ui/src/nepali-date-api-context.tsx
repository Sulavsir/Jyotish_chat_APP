'use client';

import * as React from 'react';

export interface BsMonthResponse {
  year: number;
  month: number;
  days: Array<{ nepaliDate: string; englishDate: string; day: number }>;
}

export type GetBsMonthFn = (year: number, month: number) => Promise<BsMonthResponse>;

export interface NepaliDateMapping {
  nepaliDate: string; // YYYY-MM-DD (BS)
  days: string;
}

export type GetNepaliByEnglishDateFn = (date: string) => Promise<NepaliDateMapping | null>;

export interface NepaliDateApiContextValue {
  getBsMonth?: GetBsMonthFn;
  getNepaliByEnglishDate?: GetNepaliByEnglishDateFn;
}

const NepaliDateApiContext = React.createContext<NepaliDateApiContextValue>({});

export function NepaliDateApiProvider({
  children,
  getBsMonth,
  getNepaliByEnglishDate,
}: {
  children: React.ReactNode;
  getBsMonth?: GetBsMonthFn;
  getNepaliByEnglishDate?: GetNepaliByEnglishDateFn;
}) {
  const value = React.useMemo(
    () =>
      getBsMonth || getNepaliByEnglishDate
        ? { getBsMonth, getNepaliByEnglishDate }
        : {},
    [getBsMonth, getNepaliByEnglishDate]
  );
  return (
    <NepaliDateApiContext.Provider value={value}>
      {children}
    </NepaliDateApiContext.Provider>
  );
}

export function useNepaliDateApi(): NepaliDateApiContextValue {
  return React.useContext(NepaliDateApiContext);
}
