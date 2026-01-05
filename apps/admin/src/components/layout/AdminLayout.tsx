'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAdminStore } from '@/store/admin-store';
import { adminApi } from '@/lib/admin-api';
import { Button, UsersIcon, StarIcon, ChatIcon, DocumentIcon, MoneyIcon } from '@jyotish/ui';
import { ADMIN_ROUTES } from '@/constants';
import { useAdminSocket } from '@/hooks';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, isAuthenticated, logout, setAdmin, _hasHydrated } = useAdminStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isValidatingSession, setIsValidatingSession] = useState(true);
  const { isConnected, isConnecting, error: socketError } = useAdminSocket();

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

  const handleLogout = async () => {
    await adminApi.logout();
    logout();
    router.push(ADMIN_ROUTES.LOGIN);
  };

  const navigation = [
    {
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
      name: 'Astrologers',
      href: ADMIN_ROUTES.ASTROLOGERS,
      icon: <StarIcon className="w-5 h-5" />,
    },
    {
      name: 'Users',
      href: ADMIN_ROUTES.USERS,
      icon: <UsersIcon className="w-5 h-5" />,
    },
    {
      name: 'Chat Monitor',
      href: ADMIN_ROUTES.CHATS,
      icon: <ChatIcon className="w-5 h-5" />,
    },
    {
      name: 'Chat Audit',
      href: ADMIN_ROUTES.CHAT_AUDIT,
      icon: <ChatIcon className="w-5 h-5" />,
    },
    {
      name: 'Audit Logs',
      href: ADMIN_ROUTES.AUDIT_LOGS,
      icon: <DocumentIcon className="w-5 h-5" />,
    },
    {
      name: 'Earnings',
      href: ADMIN_ROUTES.EARNINGS,
      icon: <MoneyIcon className="w-5 h-5" />,
    },
    {
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
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer relative block ${
                  isActive
                    ? 'bg-gradient-to-r from-cosmic-purple to-nebula-pink text-white glow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {item.icon}
                {sidebarOpen && <span className="font-medium">{item.name}</span>}
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
            className={`w-6 h-6 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`}
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
      <div className="flex-1 flex flex-col">
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

              <div className="text-right">
                <p className="text-sm font-medium text-white">{admin?.name}</p>
                <p className="text-xs text-slate-400">{admin?.email}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cosmic-purple to-nebula-pink flex items-center justify-center text-white font-bold">
                {admin?.name?.charAt(0) || 'A'}
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
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
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
