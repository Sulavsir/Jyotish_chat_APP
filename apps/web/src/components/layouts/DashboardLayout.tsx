/**
 * Dashboard Layout - Layout for authenticated pages
 */

'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth, useRequireAuth } from '@/hooks';
import { ROUTES } from '@/constants';
import { cn } from '@/lib/utils';
import { QUESTIONNAIRE_LANGUAGES } from '@jyotish/shared';
import { useQuestionnaireLanguageStore } from '@/store/questionnaire-language.store';
import { Popover, PopoverContent, PopoverTrigger } from '@jyotish/ui';
import { ChevronDown } from 'lucide-react';
import spaceImage from '@/assets/images/space.jpg';
import { LogoutModal } from '@/components/modals';
import { ProfileDropdown, NotificationBell, CoinDisplay } from '@/components/ui';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: '🏠' },
  { name: 'Astrologers', href: ROUTES.ASTROLOGERS, icon: '🔮' },
  { name: 'Chat', href: ROUTES.CHAT, icon: '💬' },
  { name: 'My Bookings', href: ROUTES.MY_BOOKINGS, icon: '📝' },
  { name: 'Horoscope', href: ROUTES.HOROSCOPE, icon: '⭐' },
  { name: 'Pricing', href: ROUTES.PRICING, icon: '💰' },
  { name: 'Profile', href: ROUTES.PROFILE, icon: '👤' },
];

function LanguageDropdown() {
  const language = useQuestionnaireLanguageStore((s) => s.language);
  const setLanguage = useQuestionnaireLanguageStore((s) => s.setLanguage);
  const [open, setOpen] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalContainer(document.getElementById('dropdown-portal-root'));
  }, []);

  const handleSelect = (value: 'NEPALI' | 'HINDI' | 'ENGLISH') => {
    setLanguage(value);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger
        type="button"
        className="flex h-10 w-[120px] items-center justify-between gap-2 rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
      >
        <span>{language}</span>
        <ChevronDown className="h-4 w-4 opacity-70" />
      </PopoverTrigger>
      <PopoverContent
        container={portalContainer}
        align="end"
        sideOffset={4}
        className="z-[100000] pointer-events-auto w-[120px] rounded-lg border border-purple-500/30 bg-slate-950 p-1 text-white shadow-2xl shadow-purple-900/30"
      >
        <div className="flex flex-col">
          {QUESTIONNAIRE_LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => handleSelect(lang)}
              className="rounded-sm px-3 py-2 text-left text-sm outline-none hover:bg-purple-500/15 focus:bg-purple-500/15 focus:text-white"
            >
              {lang}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
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
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-black/30 backdrop-blur-md border-b border-white/10 sticky top-0 z-50 overflow-visible">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link
                href={ROUTES.DASHBOARD}
                className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 drop-shadow-[0_0_20px_rgba(220,20,60,0.6)]"
              >
                Chat Jyotish
              </Link>

              {/* Navigation */}
              <nav className="hidden md:flex space-x-2">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 relative',
                      pathname === item.href
                        ? 'bg-purple-600/40 text-white shadow-[0_0_15px_rgba(168,85,247,0.6)] backdrop-blur-sm'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <span>{item.icon}</span>
                    {item.name}
                    {/* Info badge for incomplete profile or password not set */}
                    {item.href === ROUTES.PROFILE &&
                      (!user?.profileCompleted || !user?.hasPassword) && (
                        <span className="absolute -top-1 -right-1 group/badge">
                          <span
                            className="w-4 h-4 rounded-full flex items-center justify-center animate-pulse"
                            style={{
                              backgroundColor: !user?.profileCompleted ? '#3b82f6' : '#eab308',
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="w-2.5 h-2.5 text-white"
                            >
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="12" y1="16" x2="12" y2="12"></line>
                              <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                          </span>
                          {/* Tooltip */}
                          <span
                            className="absolute left-6 top-0 bg-gray-900 text-white text-xs rounded-lg px-3 py-1.5 opacity-0 group-hover/badge:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg border whitespace-nowrap"
                            style={{
                              borderColor: !user?.profileCompleted ? '#3b82f6' : '#eab308',
                            }}
                          >
                            {!user?.profileCompleted ? 'Complete your profile' : 'Set a password'}
                          </span>
                        </span>
                      )}
                  </Link>
                ))}
              </nav>

              {/* Notifications & User Menu */}
              <div className="flex items-center gap-2 overflow-visible">
                <LanguageDropdown />
                <CoinDisplay themeColor="purple" />
                <NotificationBell themeColor="purple" />
                <ProfileDropdown
                  user={user}
                  profileRoute={ROUTES.PROFILE}
                  settingsRoute={ROUTES.SETTINGS}
                  onLogout={handleLogoutClick}
                  themeColor="purple"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-4">{children}</main>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
        isLoading={isLoggingOut}
      />
    </div>
  );
}
