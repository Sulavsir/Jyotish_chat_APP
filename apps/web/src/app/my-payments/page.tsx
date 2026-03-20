'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants';

/**
 * Redirect /my-payments to /transactions (Transactions History)
 */
export default function MyPaymentsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(ROUTES.TRANSACTIONS);
  }, [router]);

  return null;
}
