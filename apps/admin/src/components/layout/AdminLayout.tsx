'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAdminStore } from '@/store/admin-store';
import { adminApi } from '@/lib/admin-api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  UsersIcon,
  StarIcon,
  ChatIcon,
  DocumentIcon,
  MoneyIcon,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@jyotish/ui';
import { ADMIN_QUERY_KEYS, ADMIN_ROUTES } from '@/constants';
import { useAdminSocket } from '@/hooks';
import { ADMIN_SOCKET_EVENTS } from '@/constants/socket-events.constants';

interface AdminLayoutProps {
  children: React.ReactNode;
}

type NavChildLink = {
  name: string;
  href: string;
};

type NavLinkItem = {
  kind: 'link';
  name: string;
  href: string;
  icon: React.ReactNode;
};

type NavGroupItem = {
  kind: 'group';
  name: string;
  key: 'jyotish-bookings' | 'website' | 'chat-management' | 'astrologers';
  icon: React.ReactNode;
  children: NavChildLink[];
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { admin, isAuthenticated, logout, setAdmin, _hasHydrated } = useAdminStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openGroup, setOpenGroup] = useState<
    'jyotish-bookings' | 'website' | 'chat-management' | 'astrologers' | null
  >('chat-management');
  const [isValidatingSession, setIsValidatingSession] = useState(true);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [adminStatus, setAdminStatus] = useState<'available' | 'busy'>('available');
  const { isConnected, isConnecting, error: socketError, on, off } = useAdminSocket();

  // Unread admin chat count (sidebar badge)
  const { data: unreadData } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.ADMIN_CHAT.UNREAD_COUNT(),
    queryFn: () => adminApi.adminChat.unreadCount(),
    enabled: isAuthenticated && _hasHydrated,
    staleTime: 10_000,
  });
  const unreadCount = unreadData?.count ?? 0;

  // Live update unread count on new incoming user message
  useEffect(() => {
    if (!isConnected) return;

    const handleNewAdminChatMessage = () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.ADMIN_CHAT.UNREAD_COUNT() });
    };

    on(ADMIN_SOCKET_EVENTS.ADMIN_CHAT.NEW_MESSAGE, handleNewAdminChatMessage);

    return () => {
      off(ADMIN_SOCKET_EVENTS.ADMIN_CHAT.NEW_MESSAGE, handleNewAdminChatMessage);
    };
  }, [isConnected, on, off, queryClient]);

  // Handle authentication state after hydration
  useEffect(() => {
    // Wait for Zustand to hydrate from localStorage
    if (!_hasHydrated) {
      return;
    }

    // After hydration, check authentication status
    if (!isAuthenticated) {
      router.replace(ADMIN_ROUTES.LOGIN);
      setIsValidatingSession(false);
      return;
    }

    // User is authenticated in local storage, allow access immediately
    setIsValidatingSession(false);

    // Optional: Soft validation in background (doesn't block UI)
    // This refreshes admin data and validates cookies are still valid
    adminApi
      .getProfile()
      .then((response) => {
        if (response?.admin) {
          setAdmin(response.admin);
          console.log('✅ Session validated successfully');
        }
      })
      .catch((error) => {
        // Only logout on 401 (unauthorized) errors
        if (error?.response?.status === 401) {
          console.log('🔒 Session expired, redirecting to login');
          logout();
          router.replace(ADMIN_ROUTES.LOGIN);
        } else {
          // Other errors (network, etc.) - keep user logged in
          console.warn('⚠️ Session validation failed (keeping user logged in):', error?.message);
        }
      });
  }, [_hasHydrated, isAuthenticated, router, setAdmin, logout]);

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutDialog(false);
    await adminApi.logout();
    logout();
    router.push(ADMIN_ROUTES.LOGIN);
  };

  const handleLogoutCancel = () => {
    setShowLogoutDialog(false);
  };

  const toggleAdminStatus = () => {
    setAdminStatus((prev) => (prev === 'available' ? 'busy' : 'available'));
  };

  const navigation: Array<NavLinkItem | NavGroupItem> = [
    {
      kind: 'link',
      name: 'Dashboard',
      href: ADMIN_ROUTES.DASHBOARD,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      kind: 'group',
      name: 'Jyotish Bookings',
      key: 'jyotish-bookings' as const,
      icon: <DocumentIcon className="w-5 h-5" />,
      children: [
        { name: 'Pandit Ji', href: ADMIN_ROUTES.JYOTISH_BOOKINGS_PANDIT },
        { name: 'Vaastu Shastri', href: ADMIN_ROUTES.JYOTISH_BOOKINGS_VAASTU },
        { name: 'Katha Vachak', href: ADMIN_ROUTES.JYOTISH_BOOKINGS_KATHA_VACHAK },
      ],
    },
    {
      kind: 'group',
      name: 'Website',
      key: 'website' as const,
      icon: <DocumentIcon className="w-5 h-5" />,
      children: [
        { name: 'Website Contents', href: ADMIN_ROUTES.WEBSITE_DASHBOARD_COPY },
        { name: 'Questionnaires', href: ADMIN_ROUTES.WEBSITE_QUESTIONNAIRES },
      ],
    },
    {
      kind: 'group',
      key: 'astrologers' as const,
      name: 'Astrologers',
      icon: <StarIcon className="w-5 h-5" />,
      children: [
        { name: 'All Astrologers', href: ADMIN_ROUTES.ASTROLOGERS },
        { name: 'Registration Requests', href: ADMIN_ROUTES.ASTROLOGERS_REGISTRATION_REQUESTS },
      ],
    },
    {
      kind: 'link',
      name: 'Users',
      href: ADMIN_ROUTES.USERS,
      icon: <UsersIcon className="w-5 h-5" />,
    },
    {
      kind: 'group',
      name: 'Chat Management',
      key: 'chat-management' as const,
      icon: <ChatIcon className="w-5 h-5" />,
      children: [
        { name: 'Chat Monitor', href: ADMIN_ROUTES.CHATS },
        { name: 'Chat Audit', href: ADMIN_ROUTES.CHAT_AUDIT },
        { name: 'Admin Chats', href: ADMIN_ROUTES.ADMIN_CHATS },
      ],
    },
    {
      kind: 'link',
      name: 'Complaints',
      href: ADMIN_ROUTES.COMPLAINTS,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
    },
    {
      kind: 'link',
      name: 'Appointments',
      href: ADMIN_ROUTES.APPOINTMENTS,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      kind: 'link',
      name: 'Audit Logs',
      href: ADMIN_ROUTES.AUDIT_LOGS,
      icon: <DocumentIcon className="w-5 h-5" />,
    },
    {
      kind: 'link',
      name: 'Earnings',
      href: ADMIN_ROUTES.EARNINGS,
      icon: <MoneyIcon className="w-5 h-5" />,
    },
    {
      kind: 'link',
      name: 'Coin Settings',
      href: ADMIN_ROUTES.SET_COINS,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      kind: 'link',
      name: 'Pricing',
      href: ADMIN_ROUTES.PRICING,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  if (!isAuthenticated || isValidatingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-space-black via-deep-purple to-space-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } cosmic-card transition-all duration-300 flex flex-col border-r border-slate-700 relative z-10`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cosmic-purple to-nebula-pink flex items-center justify-center glow">
              <StarIcon className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h2 className="font-bold text-white">Jyotish</h2>
                <p className="text-xs text-slate-400">Admin Panel</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 relative z-20">
          {navigation.map((item) => {
            if (item.kind === 'group') {
              const childActive = item.children.some((c) => pathname === c.href);
              // Always keep the accordion open when one of its child routes is active.
              const isOpen = childActive || openGroup === item.key;
              return (
                <div key={item.name} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setOpenGroup((prev) => (prev === item.key ? null : item.key))}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                      childActive
                        ? 'bg-gradient-to-r from-cosmic-purple/40 to-nebula-pink/20 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="relative">
                      {item.icon}
                      {item.key === 'chat-management' && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </span>
                    {sidebarOpen && (
                      <>
                        <span
                          className="font-medium flex-1 min-w-0 text-left truncate"
                          title={item.name}
                        >
                          {item.name}
                        </span>
                        <svg
                          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </>
                    )}
                  </button>

                  {sidebarOpen && isOpen && (
                    <div className="ml-6 pl-3 border-l border-slate-700 space-y-1">
                      {item.children.map((c) => {
                        const active = pathname === c.href;
                        const isAdminChats = c.href === ADMIN_ROUTES.ADMIN_CHATS;
                        return (
                          <Link
                            key={c.href}
                            href={c.href}
                            className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                              active
                                ? 'text-white bg-slate-800/60'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                            }`}
                            title={c.name}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate min-w-0">{c.name}</span>
                              {isAdminChats && unreadCount > 0 && (
                                <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold">
                                  {unreadCount}
                                </span>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = pathname === item.href;
            const isAdminChats = item.href === ADMIN_ROUTES.ADMIN_CHATS;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-gradient-to-r from-cosmic-purple to-nebula-pink text-white glow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
                title={item.name}
              >
                {item.icon}
                {sidebarOpen && (
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium truncate min-w-0">{item.name}</span>
                    {isAdminChats && unreadCount > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Toggle Sidebar */}
        <Button
          variant="ghost"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-4 border-t border-slate-700 text-slate-400 hover:text-white"
        >
          <svg
            className={`w-6 h-6 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </Button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="cosmic-card border-b border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cosmic-purple to-nebula-pink bg-clip-text text-white">
                Cosmic Control Center
              </h1>
              <p className="text-sm text-slate-400">Manage your Jyotish platform</p>
            </div>

            {/* Admin Profile */}
            <div className="flex items-center gap-4">
              {/* Real-time Connection Status */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700">
                {isConnecting ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                    <span className="text-xs text-slate-400">Connecting...</span>
                  </>
                ) : isConnected ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-green-400">Live</span>
                  </>
                ) : socketError ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-xs text-red-400">Offline</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-gray-500" />
                    <span className="text-xs text-slate-400">Disconnected</span>
                  </>
                )}
              </div>

              {/* Admin Status Toggle */}
              <button
                onClick={toggleAdminStatus}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 transition-colors cursor-pointer"
                title={`Status: ${adminStatus === 'available' ? 'Available' : 'Busy'}`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    adminStatus === 'available' ? 'bg-green-500' : 'bg-orange-500'
                  } animate-pulse`}
                />
                <span
                  className={`text-xs font-medium ${
                    adminStatus === 'available' ? 'text-green-400' : 'text-orange-400'
                  }`}
                >
                  {adminStatus === 'available' ? 'Available' : 'Busy'}
                </span>
              </button>

              <div className="text-right">
                <p className="text-sm font-medium text-white">{admin?.name}</p>
                <p className="text-xs text-slate-400">{admin?.email}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cosmic-purple to-nebula-pink flex items-center justify-center text-white font-bold">
                {admin?.name?.charAt(0) || 'A'}
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogoutClick} title="Logout">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 min-w-0 overflow-auto p-6">{children}</main>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Confirm Logout</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to logout? You will need to login again to access the admin
              panel.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleLogoutCancel} className="border-slate-700">
              Cancel
            </Button>
            <Button
              onClick={handleLogoutConfirm}
              className="bg-gradient-to-r from-cosmic-purple to-nebula-pink hover:opacity-90"
            >
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
