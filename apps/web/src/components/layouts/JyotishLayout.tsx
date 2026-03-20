/**
 * Jyotish Layout - Layout for astrologer pages
 * Clean, professional design with warm indigo/sand palette
 */

'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  CalendarDays,
  Clock,
  User,
  LogOut,
  Banknote,
} from 'lucide-react';
import { AppSidebar } from '@jyotish/ui';
import { useAuth, useRequireAuth } from '@/hooks';
import { ROUTES, USER_ROLES } from '@/constants';
import { cn } from '@/lib/utils';
import { LogoutModal } from '@/components/modals';
import { ProfileDropdown, NotificationBell, AppLogo } from '@/components/ui';
import { OnlineStatusToggle } from '@/components/ui/OnlineStatusToggle';
import { InstantChatRequestBar } from '@/components/features/instant-chat/InstantChatRequestBar';
import { BroadcastMessageBar } from '@/components/features/broadcast-chat/BroadcastMessageBar';
import { getAstrologerPermissionsFromUser } from '@/lib/auth';

interface JyotishLayoutProps {
  children: ReactNode;
}

export function JyotishLayout({ children }: JyotishLayoutProps) {
  const pathname = usePathname();
  const { user } = useRequireAuth();
  const { handleLogout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { canAccessAppointments: hasAppointmentAccess, canAcceptBroadcastMessages } =
    getAstrologerPermissionsFromUser(user);

  const shouldShowChatWidgets =
    pathname === ROUTES.JYOTISH_CHAT || pathname?.startsWith(`${ROUTES.JYOTISH_CHAT}?`);

  const sidebarItems = [
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
      {/* Astrology night-sky background - fixed so only main content scrolls */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/astrology.jpg)' }}
        aria-hidden
      />
      <div className="fixed inset-0 z-0 bg-black/55 pointer-events-none" aria-hidden />

      <div className="relative z-10 flex flex-col h-screen overflow-hidden">
        <header className="flex-shrink-0 z-40 border-b border-white/[0.06] bg-[#0f0e14]/80 backdrop-blur-xl">
          <div className="flex items-center h-14 lg:h-16">
            <div className="flex-shrink-0 flex items-center gap-2 pl-4 lg:pl-6 min-w-0">
              <AppLogo
                href={ROUTES.JYOTISH_DASHBOARD}
                height={32}
                blendWithDarkBackground
                className="flex-shrink-0"
              />
              <span className="hidden sm:inline whitespace-nowrap">
                <span className="text-lg font-semibold text-amber-400">Jyotish</span>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">
                  Portal
                </span>
              </span>
            </div>
            <div className="flex-1 flex justify-end pr-4 lg:pr-6 gap-2">
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

        <div className="flex-1 flex min-h-0 overflow-hidden">
          <AppSidebar
            items={sidebarItems}
            currentPath={pathname}
            themeColor="orange"
            onLogout={handleLogoutClick}
            logoutLabel="Logout"
            logoutIcon={<LogOut className="h-4 w-4" />}
            renderLink={({ href, className, children }) => (
              <Link href={href} className={className}>
                {children}
              </Link>
            )}
          />

          <main className="flex-1 min-h-0 overflow-auto">
            <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pb-24 md:pb-8">{children}</div>
          </main>
        </div>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-16 border-t border-white/[0.06] bg-[#0f0e14]/90 backdrop-blur-xl">
          {sidebarItems.slice(0, 4).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                  isActive ? 'text-amber-400' : 'text-[#78716c] hover:text-[#a8a29e]'
                )}
              >
                {item.icon && (
                  <span className="h-5 w-5 flex items-center justify-center">{item.icon}</span>
                )}
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
          <Link
            href={ROUTES.JYOTISH_PROFILE}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
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

      {user?.role === USER_ROLES.ASTROLOGER &&
        canAcceptBroadcastMessages &&
        (shouldShowChatWidgets ? (
          <>
            <InstantChatRequestBar />
            <BroadcastMessageBar />
          </>
        ) : null)}
    </div>
  );
}
