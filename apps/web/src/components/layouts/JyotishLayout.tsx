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
  User,
  LogOut,
} from 'lucide-react';
import { useAuth, useRequireAuth } from '@/hooks';
import { ROUTES, USER_ROLES } from '@/constants';
import { cn } from '@/lib/utils';
import { LogoutModal } from '@/components/modals';
import { ProfileDropdown, NotificationBell } from '@/components/ui';
import { OnlineStatusToggle } from '@/components/ui/OnlineStatusToggle';
import { InstantChatRequestBar } from '@/components/features/instant-chat/InstantChatRequestBar';
import { BroadcastMessageBar } from '@/components/features/broadcast-chat/BroadcastMessageBar';
import { getAstrologerPermissionsFromUser } from '@/lib/auth';

interface JyotishLayoutProps {
  children: ReactNode;
}

const navIcons = {
  Dashboard: LayoutDashboard,
  Chats: MessageSquare,
  Consultations: Calendar,
  Appointments: CalendarDays,
  Profile: User,
};

export function JyotishLayout({ children }: JyotishLayoutProps) {
  const pathname = usePathname();
  const { user } = useRequireAuth();
  const { handleLogout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { canAccessAppointments: hasAppointmentAccess, canAcceptBroadcastMessages } =
    getAstrologerPermissionsFromUser(user);

  const navigation = [
    { name: 'Dashboard', href: ROUTES.JYOTISH_DASHBOARD },
    { name: 'Chats', href: ROUTES.JYOTISH_CHAT },
    { name: 'Consultations', href: ROUTES.JYOTISH_CONSULTATIONS },
    ...(hasAppointmentAccess ? [{ name: 'Appointments', href: ROUTES.JYOTISH_APPOINTMENTS }] : []),
    { name: 'Profile', href: ROUTES.JYOTISH_PROFILE },
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
            <div className="w-56 flex-shrink-0 flex items-center pl-4 lg:pl-6">
              <Link
                href={ROUTES.JYOTISH_DASHBOARD}
                className="flex items-center gap-2 text-[#fafaf9] hover:text-white transition-colors"
              >
                <span className="text-lg font-semibold tracking-tight">Jyotish</span>
                <span className="text-xs font-medium text-amber-500/90 uppercase tracking-wider hidden sm:inline">
                  Portal
                </span>
              </Link>
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
          <aside className="w-56 flex-shrink-0 hidden md:block border-r border-white/[0.06] bg-[#0f0e14]/50">
            <nav className="p-3 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = navIcons[item.name as keyof typeof navIcons];
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
                    {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              <button
                onClick={handleLogoutClick}
                className="md:hidden w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#a8a29e] hover:text-[#fafaf9] hover:bg-white/[0.04] text-sm font-medium transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </nav>
          </aside>

          <main className="flex-1 min-h-0 overflow-auto">
            <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pb-24 md:pb-8">{children}</div>
          </main>
        </div>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-16 border-t border-white/[0.06] bg-[#0f0e14]/90 backdrop-blur-xl">
          {navigation.slice(0, 4).map((item) => {
            const isActive = pathname === item.href;
            const Icon = navIcons[item.name as keyof typeof navIcons];
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                  isActive ? 'text-amber-400' : 'text-[#78716c] hover:text-[#a8a29e]'
                )}
              >
                {Icon && <Icon className="h-5 w-5" />}
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
          <Link
            href={ROUTES.JYOTISH_PROFILE}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
              pathname === ROUTES.JYOTISH_PROFILE ? 'text-amber-400' : 'text-[#78716c] hover:text-[#a8a29e]'
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

      {user?.role === USER_ROLES.ASTROLOGER && canAcceptBroadcastMessages && (
        <>
          <InstantChatRequestBar />
          <BroadcastMessageBar />
        </>
      )}
    </div>
  );
}
