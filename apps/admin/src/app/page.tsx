'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ADMIN_ROUTES } from '@/constants';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page
    router.replace(ADMIN_ROUTES.LOGIN);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-cosmic-purple border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
