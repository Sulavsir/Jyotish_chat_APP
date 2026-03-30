/**
 * Jyotish Layout - Layout for astrologer pages
 * Navigation lives in the top header; the left column is for incoming client requests (inDrive-style).
 */

'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  CalendarDays,
  Clock,
  User,
  Banknote,
  Inbox,
  X,
} from 'lucide-react';
import { useAuth, useRequireAuth, useAstrologerPresenceSync } from '@/hooks';
import { ROUTES, USER_ROLES, QUERY_KEYS } from '@/constants';
import { getUnreadCount } from '@/services/chat.service';
import { cn } from '@/lib/utils';
import { LogoutModal } from '@/components/modals';
import { ProfileDropdown, NotificationBell, AppLogo } from '@/components/ui';
import { OnlineStatusToggle } from '@/components/ui/OnlineStatusToggle';
import { JyotishRequestsColumn } from '@/components/layouts/JyotishRequestsColumn';
import { getAstrologerPermissionsFromUser } from '@/lib/auth';

interface JyotishLayoutProps {
  children: ReactNode;
}

export function JyotishLayout({ children }: JyotishLayoutProps) {
  useAstrologerPresenceSync();
  const pathname = usePathname();
  const { user } = useRequireAuth();
  const { handleLogout } = useAuth();

  const { data: chatUnreadNav = 0 } = useQuery({
    queryKey: QUERY_KEYS.CHAT.UNREAD_COUNT,
    queryFn: () => getUnreadCount(),
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    /** Backup if a socket event is missed */
    refetchInterval: 45 * 1000,
    enabled: !!user?.id && user?.role === USER_ROLES.ASTROLOGER,
  });
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [requestsDrawerOpen, setRequestsDrawerOpen] = useState(false);

  const { canAccessAppointments: hasAppointmentAccess, canAcceptBroadcastMessages } =
    getAstrologerPermissionsFromUser(user);

  const showRequestsSidebar =
    user?.role === USER_ROLES.ASTROLOGER && canAcceptBroadcastMessages;

  useEffect(() => {
    setRequestsDrawerOpen(false);
  }, [pathname]);

  const navItems = [
    {
      name: 'Dashboard',
      href: ROUTES.JYOTISH_DASHBOARD,
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    { name: 'Chats', href: ROUTES.JYOTISH_CHAT, icon: <MessageSquare className="h-4 w-4" /> },
    {
      name: 'Consultations',
      href: ROUTES.JYOTISH_CONSULTATIONS,
      icon: <Calendar className="h-4 w-4" />,
    },
    ...(hasAppointmentAccess
      ? [
          {
            name: 'Appointments',
            href: ROUTES.JYOTISH_APPOINTMENTS,
            icon: <CalendarDays className="h-4 w-4" />,
          },
        ]
      : []),
    ...(hasAppointmentAccess
      ? [{ name: 'My slots', href: ROUTES.JYOTISH_SLOTS, icon: <Clock className="h-4 w-4" /> }]
      : []),
    { name: 'My Earnings', href: ROUTES.JYOTISH_EARNINGS, icon: <Banknote className="h-4 w-4" /> },
    { name: 'Profile', href: ROUTES.JYOTISH_PROFILE, icon: <User className="h-4 w-4" /> },
  ];

  const handleLogoutClick = () => setIsLogoutModalOpen(true);

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await handleLogout();
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0e14]">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/astrology.jpg)' }}
        aria-hidden
      />
      <div className="pointer-events-none fixed inset-0 z-0 bg-black/55" aria-hidden />

      <div className="relative z-10 flex h-screen flex-col overflow-hidden">
        <header className="z-40 flex-shrink-0 border-b border-white/[0.06] bg-[#0f0e14]/80 backdrop-blur-xl">
          <div className="flex h-14 items-center gap-2 px-3 lg:h-16 lg:gap-4 lg:px-6">
            <div className="flex min-w-0 flex-shrink-0 items-center gap-2">
              <AppLogo
                href={ROUTES.JYOTISH_DASHBOARD}
                height={32}
                blendWithDarkBackground
                className="flex-shrink-0"
              />
              <span className="hidden sm:inline whitespace-nowrap">
                <span className="text-lg font-semibold text-amber-400">Jyotish</span>
                <span className="ml-1 text-xs font-medium uppercase tracking-wider text-slate-400">
                  Portal
                </span>
              </span>
            </div>

            {/* Primary navigation (desktop / tablet) */}
            <nav
              className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto px-1 md:flex lg:gap-1"
              aria-label="Main navigation"
            >
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const showChatBadge =
                  item.href === ROUTES.JYOTISH_CHAT && chatUnreadNav > 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex shrink-0 items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors lg:px-3 lg:text-sm',
                      isActive
                        ? 'border-amber-500/25 bg-amber-500/15 text-amber-400'
                        : 'border-transparent text-[#a8a29e] hover:bg-white/[0.04] hover:text-[#fafaf9]'
                    )}
                  >
                    <span className="relative inline-flex shrink-0">
                      {item.icon}
                      {showChatBadge && (
                        <span
                          className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-0.5 text-[10px] font-bold leading-none text-white shadow-md ring-2 ring-[#0f0e14]"
                          aria-hidden
                        >
                          {chatUnreadNav > 99 ? '99+' : chatUnreadNav}
                        </span>
                      )}
                    </span>
                    <span className="max-w-[140px] truncate lg:max-w-none">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="ml-auto flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
              {showRequestsSidebar && (
                <button
                  type="button"
                  onClick={() => setRequestsDrawerOpen(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-amber-400/90 transition-colors hover:bg-white/[0.08] md:hidden"
                  aria-label="Open incoming requests"
                >
                  <Inbox className="h-5 w-5" />
                </button>
              )}
              <OnlineStatusToggle />
              <NotificationBell themeColor="orange" />
              <ProfileDropdown
                user={user}
                profileRoute={ROUTES.JYOTISH_PROFILE}
                settingsRoute={ROUTES.JYOTISH_SETTINGS}
                onLogout={handleLogoutClick}
                themeColor="orange"
              />
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Mobile drawer backdrop */}
          {showRequestsSidebar && requestsDrawerOpen && (
            <button
              type="button"
              className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-[2px] md:hidden"
              aria-label="Close requests panel"
              onClick={() => setRequestsDrawerOpen(false)}
            />
          )}

          {showRequestsSidebar && (
            <aside
              className={cn(
                'relative z-[70] h-full min-h-0 w-[min(100vw,320px)] flex-shrink-0 flex-col overflow-hidden border-r border-white/[0.06] bg-[#0f0e14]/85 backdrop-blur-xl',
                requestsDrawerOpen ? 'fixed inset-y-0 left-0 flex shadow-2xl' : 'hidden',
                'md:static md:flex md:w-[300px] md:shadow-none'
              )}
              aria-label="Incoming client requests"
            >
              <button
                type="button"
                onClick={() => setRequestsDrawerOpen(false)}
                className="absolute right-2 top-2 z-[71] flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/40 text-slate-300 backdrop-blur md:hidden"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
              <JyotishRequestsColumn />
            </aside>
          )}

          <main className="min-h-0 flex-1 overflow-auto">
            <div className="px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8 md:pb-8">{children}</div>
          </main>
        </div>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-white/[0.06] bg-[#0f0e14]/90 backdrop-blur-xl md:hidden">
          {navItems.slice(0, 4).map((item) => {
            const isActive = pathname === item.href;
            const showChatBadge =
              item.href === ROUTES.JYOTISH_CHAT && chatUnreadNav > 0;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex h-full flex-1 flex-col items-center justify-center gap-1 transition-colors',
                  isActive ? 'text-amber-400' : 'text-[#78716c] hover:text-[#a8a29e]'
                )}
              >
                {item.icon && (
                  <span className="relative flex h-5 w-5 items-center justify-center">
                    {item.icon}
                    {showChatBadge && (
                      <span
                        className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-0.5 text-[9px] font-bold leading-none text-white ring-2 ring-[#0f0e14]"
                        aria-hidden
                      >
                        {chatUnreadNav > 99 ? '99+' : chatUnreadNav}
                      </span>
                    )}
                  </span>
                )}
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
          <Link
            href={ROUTES.JYOTISH_PROFILE}
            className={cn(
              'flex h-full flex-1 flex-col items-center justify-center gap-1 transition-colors',
              pathname === ROUTES.JYOTISH_PROFILE
                ? 'text-amber-400'
                : 'text-[#78716c] hover:text-[#a8a29e]'
            )}
          >
            <User className="h-5 w-5" />
            <span className="text-[10px] font-medium">Profile</span>
          </Link>
        </nav>
      </div>

      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
        isLoading={isLoggingOut}
      />
    </div>
  );
}
