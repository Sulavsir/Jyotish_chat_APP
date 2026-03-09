/**
 * Dashboard Layout - Client app layout with sidebar (same pattern as Jyotish).
 * Navbar: logo, language, balance, notification, profile.
 * Sidebar: Dashboard, Astrologers, Chat, My Bookings, Horoscope, Pricing, Profile.
 */

'use client';

import { ReactNode, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageCircle,
  CalendarCheck,
  Star,
  Wallet,
  User,
  Sparkles,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { AppSidebar } from '@jyotish/ui';
import { AppLogo } from '@/components/ui/AppLogo';
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
  hideBackground?: boolean;
}

function LanguageDropdown() {
  const language = useQuestionnaireLanguageStore((s) => s.language);
  const setLanguage = useQuestionnaireLanguageStore((s) => s.setLanguage);
  const [open, setOpen] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalContainer(document.getElementById('dropdown-portal-root'));
  }, []);

  const handleSelect = (value: (typeof QUESTIONNAIRE_LANGUAGES)[number]) => {
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

const ProfileBadge = ({ showProfileAlert }: { showProfileAlert: boolean }) =>
  showProfileAlert ? (
    <span
      className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"
      title="Complete your profile or set password"
    />
  ) : null;

export function DashboardLayout({ children, hideBackground }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user } = useRequireAuth();
  const { handleLogout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const showProfileAlert = Boolean(user && (!user.profileCompleted || !user.hasPassword));

  const sidebarItems = [
    { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: <LayoutDashboard className="h-4 w-4" /> },
    { name: 'Astrologers', href: ROUTES.ASTROLOGERS, icon: <Sparkles className="h-4 w-4" /> },
    { name: 'Chat', href: ROUTES.CHAT, icon: <MessageCircle className="h-4 w-4" /> },
    { name: 'My Bookings', href: ROUTES.MY_BOOKINGS, icon: <CalendarCheck className="h-4 w-4" /> },
    { name: 'Horoscope', href: ROUTES.HOROSCOPE, icon: <Star className="h-4 w-4" /> },
    { name: 'Pricing', href: ROUTES.PRICING, icon: <Wallet className="h-4 w-4" /> },
    {
      name: 'Profile',
      href: ROUTES.PROFILE,
      icon: <User className="h-4 w-4" />,
      badge: <ProfileBadge showProfileAlert={showProfileAlert} />,
    },
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
    <div className={cn('min-h-screen relative', hideBackground && 'bg-black')}>
      {!hideBackground && (
        <div className="fixed inset-0 z-0">
          <Image src={spaceImage} alt="" fill className="object-cover" quality={90} priority />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
        </div>
      )}

      <div className="relative z-50 flex flex-col h-screen overflow-hidden">
        <div className="flex-shrink-0 h-14 lg:h-16" aria-hidden />

        <div className="flex-1 flex min-h-0 overflow-hidden">
          <div className="hidden lg:block flex-shrink-0 h-full min-h-0">
            <AppSidebar
              items={sidebarItems}
              currentPath={pathname}
              themeColor="purple"
              onLogout={handleLogoutClick}
              logoutLabel="Logout"
              logoutIcon={<LogOut className="h-4 w-4" />}
              renderLink={({ href, className, children }) => (
                <Link href={href} className={className}>
                  {children}
                </Link>
              )}
            />
          </div>

          <main className="flex-1 min-h-0 overflow-auto">
            <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pb-8">{children}</div>
          </main>
        </div>
      </div>

      {/* Header + mobile menu portaled to body with z-[100000] so they sit above the fake cursor (z-99999) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-x-0 top-0 z-[100000] pointer-events-none">
            <div className="pointer-events-auto">
              <header className="flex-shrink-0 border-b border-white/10 bg-black/10 backdrop-blur-md">
                <div className="flex items-center h-14 lg:h-16 gap-2">
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen((o) => !o)}
                    className="lg:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                  >
                    {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                  </button>
                  <div className="flex-shrink-0 flex items-center gap-2 pl-2 lg:pl-6 min-w-0">
                    <AppLogo
                      href={ROUTES.DASHBOARD}
                      height={32}
                      blendWithDarkBackground
                      className="flex-shrink-0"
                    />
                    <span className="hidden sm:inline whitespace-nowrap">
                      <span className="text-lg font-semibold text-purple-400">Client</span>
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">
                        Portal
                      </span>
                    </span>
                  </div>
                  <div className="flex-1 min-w-0" />
                  <div className="flex items-center justify-end gap-2 pr-2 lg:pr-6 flex-shrink-0">
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
              </header>
            </div>
            {mobileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-[100000] bg-black/50 backdrop-blur-sm lg:hidden pointer-events-auto"
                  aria-hidden
                  onClick={() => setMobileMenuOpen(false)}
                />
                <aside
                  className="fixed top-0 left-0 bottom-0 z-[100001] w-72 max-w-[85vw] bg-[#0f0e14]/95 border-r border-white/10 shadow-xl lg:hidden flex flex-col pointer-events-auto"
                  aria-label="Mobile menu"
                >
                  <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <AppLogo
                        href={ROUTES.DASHBOARD}
                        height={32}
                        blendWithDarkBackground
                        className="flex-shrink-0"
                      />
                      <span className="whitespace-nowrap">
                        <span className="text-sm font-semibold text-purple-400">Client</span>
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">
                          Portal
                        </span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
                      aria-label="Close menu"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <nav className="p-3 flex-1 overflow-auto space-y-1">
                    {sidebarItems.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border',
                            isActive
                              ? 'bg-purple-500/15 text-purple-400 border-purple-500/20'
                              : 'text-gray-300 hover:text-white hover:bg-white/[0.04] border-transparent'
                          )}
                        >
                          {item.icon && <span className="h-4 w-4 flex-shrink-0">{item.icon}</span>}
                          <span>{item.name}</span>
                          {item.badge}
                        </Link>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogoutClick();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.04] text-sm font-medium transition-colors border border-transparent"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </nav>
                </aside>
              </>
            )}
          </div>,
          document.body
        )}

      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
        isLoading={isLoggingOut}
      />
    </div>
  );
}
