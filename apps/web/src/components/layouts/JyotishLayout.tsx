/**
 * Jyotish Layout - Layout for astrologer pages
 */

'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth, useRequireAuth } from '@/hooks';
import { ROUTES, USER_ROLES } from '@/constants';
import { Button } from '@jyotish/ui';
import { cn } from '@/lib/utils';
import spaceImage from '@/assets/images/space.jpg';
import { LogoutModal } from '@/components/modals';
import { ProfileDropdown, NotificationBell } from '@/components/ui';
import { InstantChatRequestBar } from '@/components/features/instant-chat/InstantChatRequestBar';
import { BroadcastMessageBar } from '@/components/features/broadcast-chat/BroadcastMessageBar';

interface JyotishLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: ROUTES.JYOTISH_DASHBOARD, icon: '📊' },
  { name: 'Chats', href: ROUTES.JYOTISH_CHAT, icon: '💬' },
  { name: 'Consultations', href: ROUTES.JYOTISH_CONSULTATIONS, icon: '📅' },
  { name: 'Profile', href: ROUTES.JYOTISH_PROFILE, icon: '👤' },
];

export function JyotishLayout({ children }: JyotishLayoutProps) {
  const pathname = usePathname();
  const { user } = useRequireAuth();
  const { handleLogout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

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
    <div className="min-h-screen relative">
      {/* Cosmic Background */}
      <div className="fixed inset-0 z-0">
        <Image
          src={spaceImage}
          alt="Cosmic Space"
          fill
          className="object-cover"
          quality={90}
          priority
        />
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Navigation Bar */}
        <header className="bg-black/30 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center h-16">
            {/* Left Side - Logo (fixed width, aligned with sidebar) */}
            <div className="w-64 flex-shrink-0 flex items-center px-4">
              <Link href={ROUTES.JYOTISH_DASHBOARD} className="flex items-center">
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-yellow-500 to-amber-500">
                  Jyotish Portal
                </span>
              </Link>
            </div>

            {/* Right Side - Notifications & User Menu */}
            <div className="flex-1 flex justify-end pr-4 sm:pr-6 lg:pr-8">
              <div className="flex items-center gap-2">
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
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex">
          {/* Sidebar Navigation */}
          <aside className="w-64 bg-black/20 backdrop-blur-sm border-r border-white/10 hidden md:block">
            <nav className="p-4 space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-3 px-4 py-3 rounded-lg transition-all',
                      isActive
                        ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-semibold">{item.name}</span>
                  </Link>
                );
              })}

              {/* Mobile Logout */}
              <button
                onClick={handleLogoutClick}
                className="md:hidden w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-all"
              >
                <span className="text-xl">🚪</span>
                <span className="font-semibold">Logout</span>
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="px-4 sm:px-6 lg:px-8 py-8">{children}</div>
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/30 backdrop-blur-md border-t border-white/10 z-50">
          <nav className="flex justify-around items-center h-16">
            {navigation.slice(0, 4).map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center flex-1 h-full transition-all',
                    isActive ? 'text-orange-400 bg-white/5' : 'text-gray-400 hover:text-white'
                  )}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-xs mt-1">{item.name}</span>
                </Link>
              );
            })}
            <Link
              href={ROUTES.JYOTISH_PROFILE}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full transition-all',
                pathname === ROUTES.JYOTISH_PROFILE
                  ? 'text-orange-400 bg-white/5'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              <span className="text-2xl">👤</span>
              <span className="text-xs mt-1">Profile</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
        isLoading={isLoggingOut}
      />

      {/* Instant Chat Request Bar (only for astrologers) */}
      {user?.role === USER_ROLES.ASTROLOGER && <InstantChatRequestBar />}

      {/* Broadcast Message Bar (only for astrologers) */}
      {user?.role === USER_ROLES.ASTROLOGER && <BroadcastMessageBar />}
    </div>
  );
}
