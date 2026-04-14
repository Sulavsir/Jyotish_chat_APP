'use client';

/**
 * Single persistent shell for all `/admin/*` routes (except login).
 * Keeps one AdminLayout + singleton socket across client-side navigations.
 */

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { ADMIN_ROUTES } from '@/constants';

export default function AdminSectionLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginRoute =
    pathname === ADMIN_ROUTES.LOGIN || pathname === `${ADMIN_ROUTES.LOGIN}/`;

  if (isLoginRoute) {
    return <>{children}</>;
  }

  return <AdminLayout>{children}</AdminLayout>;
}
