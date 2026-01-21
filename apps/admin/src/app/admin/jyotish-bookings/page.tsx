'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { ADMIN_ROUTES } from '@/constants';

export default function JyotishBookingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(ADMIN_ROUTES.JYOTISH_BOOKINGS_PANDIT);
  }, [router]);

  return (
    <AdminLayout>
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-slate-400">Redirecting...</p>
        </div>
      </div>
    </AdminLayout>
  );
}

