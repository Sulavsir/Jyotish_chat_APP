'use client';

import { type ReactNode } from 'react';
import { NepaliDateApiProvider } from '@jyotish/ui';
import { nepaliDateService } from '@/services/nepali-date.service';

export function NepaliDateProvider({ children }: { children: ReactNode }) {
  return (
    <NepaliDateApiProvider getBsMonth={nepaliDateService.getBsMonth.bind(nepaliDateService)}>
      {children}
    </NepaliDateApiProvider>
  );
}
