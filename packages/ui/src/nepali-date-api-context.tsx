'use client';

import * as React from 'react';

export interface BsMonthResponse {
  year: number;
  month: number;
  days: Array<{ nepaliDate: string; englishDate: string; day: number }>;
}

export type GetBsMonthFn = (year: number, month: number) => Promise<BsMonthResponse>;

export interface NepaliDateApiContextValue {
  getBsMonth?: GetBsMonthFn;
}

const NepaliDateApiContext = React.createContext<NepaliDateApiContextValue>({});

export function NepaliDateApiProvider({
  children,
  getBsMonth,
}: {
  children: React.ReactNode;
  getBsMonth?: GetBsMonthFn;
}) {
  const value = React.useMemo(
    () => (getBsMonth ? { getBsMonth } : {}),
    [getBsMonth]
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
