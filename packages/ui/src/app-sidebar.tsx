'use client';

import * as React from 'react';
import { cn } from './utils';

export interface AppSidebarItem {
  name: string;
  href: string;
  icon?: React.ReactNode;
  /** Optional badge (e.g. notification dot or "Complete profile" indicator). */
  badge?: React.ReactNode;
}

export interface AppSidebarProps {
  items: AppSidebarItem[];
  currentPath: string;
  themeColor?: 'purple' | 'orange';
  onLogout?: () => void;
  logoutLabel?: string;
  /** Render a link; receives href, className, and children. App can use Next Link here. */
  renderLink: (props: {
    href: string;
    className?: string;
    children: React.ReactNode;
  }) => React.ReactNode;
  /** Optional custom logout icon (e.g. LogOut from lucide). */
  logoutIcon?: React.ReactNode;
  className?: string;
  /** Optional content below nav items (e.g. mobile logout button). */
  footer?: React.ReactNode;
}

const themeClasses = {
  purple: {
    active: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    inactive: 'text-[#a8a29e] hover:text-[#fafaf9] hover:bg-white/[0.04] border-transparent',
  },
  orange: {
    active: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    inactive: 'text-[#a8a29e] hover:text-[#fafaf9] hover:bg-white/[0.04] border-transparent',
  },
};

export function AppSidebar({
  items,
  currentPath,
  themeColor = 'purple',
  onLogout,
  logoutLabel = 'Logout',
  renderLink,
  logoutIcon,
  className,
  footer,
}: AppSidebarProps) {
  const theme = themeClasses[themeColor];

  return (
    <aside
      className={cn(
        'w-56 flex-shrink-0 hidden md:block border-r border-white/[0.06] bg-[#0f0e14]/50 min-h-full h-full',
        className
      )}
      aria-label="Sidebar navigation"
    >
      <nav className="p-3 space-y-1">
        {items.map((item) => {
          const isActive = currentPath === item.href;
          return (
            <React.Fragment key={item.href}>
              {renderLink({
                href: item.href,
                className: cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border',
                  isActive ? theme.active : theme.inactive
                ),
                children: (
                  <>
                    {item.icon && <span className="h-4 w-4 flex-shrink-0">{item.icon}</span>}
                    <span className="flex-1 min-w-0 truncate">{item.name}</span>
                    {item.badge}
                  </>
                ),
              })}
            </React.Fragment>
          );
        })}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="md:hidden w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#a8a29e] hover:text-[#fafaf9] hover:bg-white/[0.04] text-sm font-medium transition-colors border border-transparent"
          >
            {logoutIcon && <span className="h-4 w-4 flex-shrink-0">{logoutIcon}</span>}
            <span>{logoutLabel}</span>
          </button>
        )}
        {footer}
      </nav>
    </aside>
  );
}
