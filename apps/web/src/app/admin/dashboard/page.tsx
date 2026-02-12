/**
 * Admin Dashboard - landing page for admin
 */

'use client';

import Link from 'next/link';
import { ROUTES } from '@/constants';
import { LayoutDashboard, Coins } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
        <LayoutDashboard className="h-7 w-7 text-amber-400" />
        Admin Dashboard
      </h1>
      <p className="text-white/60">Use the sidebar to manage platform settings.</p>
      <div className="flex flex-wrap gap-4">
        <Link
          href={ROUTES.ADMIN_SET_COINS}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
        >
          <Coins className="h-4 w-4" />
          Coin Settings
        </Link>
      </div>
    </div>
  );
}
