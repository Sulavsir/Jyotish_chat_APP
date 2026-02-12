/**
 * Admin layout with sidebar
 * Admin auth is enforced by the API (ADMIN role required)
 */

'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/constants';
import { LayoutDashboard, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarNav = [
  { name: 'Dashboard', href: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard },
  { name: 'Coin Settings', href: ROUTES.ADMIN_SET_COINS, icon: Coins },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0f0e14] text-white flex">
      <aside className="w-56 flex-shrink-0 border-r border-white/[0.06] bg-[#0f0e14]/80 hidden md:flex flex-col">
        <div className="p-4 border-b border-white/[0.06]">
          <Link href={ROUTES.ADMIN_DASHBOARD} className="font-semibold text-white tracking-tight">
            Admin
          </Link>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          {sidebarNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                    : 'text-[#a8a29e] hover:text-[#fafaf9] hover:bg-white/[0.04] border border-transparent'
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 min-h-0 overflow-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
