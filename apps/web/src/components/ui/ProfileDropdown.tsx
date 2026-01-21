/**
 * Profile Dropdown Component
 * Displays user profile menu with options like Profile, Settings, and Logout
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { getImageUrl } from '@/utils/image.utils';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@jyotish/ui';
import { User } from 'lucide-react';

export interface ProfileDropdownProps {
  user: {
    name?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    profilePhoto?: string | null;
  } | null;
  profileRoute: string;
  settingsRoute?: string;
  onLogout: () => void;
  /** Theme color for the avatar border and hover effects */
  themeColor?: 'purple' | 'orange';
}

export function ProfileDropdown({
  user,
  profileRoute,
  settingsRoute,
  onLogout,
  themeColor = 'purple',
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const themeColors = {
    purple: {
      border: 'border-purple-500/50',
      gradient: 'from-purple-500 to-pink-600',
      hover: 'hover:bg-purple-500/10',
      icon: '🟣',
    },
    orange: {
      border: 'border-orange-500/50',
      gradient: 'from-orange-500 to-amber-600',
      hover: 'hover:bg-orange-500/10',
      icon: '🟠',
    },
  };

  const theme = themeColors[themeColor];

  // Update dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8, // 8px gap below button
        right: window.innerWidth - rect.right, // align to right edge of button
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const imageUrl = getImageUrl(user?.profilePhoto);

  return (
    <>
      {/* Profile Avatar Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative group focus:outline-none"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <div className="relative">
          <Avatar
            className={cn(
              'h-10 w-10 border-2 cursor-pointer hover:scale-110 transition-transform',
              theme.border
            )}
          >
            {imageUrl && (
              <AvatarImage src={imageUrl} alt={user?.name || 'Profile'} className="object-cover" />
            )}
            <AvatarFallback
              className={cn(
                'bg-gradient-to-br flex items-center justify-center text-white font-bold',
                theme.gradient
              )}
            >
              {!user?.profilePhoto && !user?.name ? (
                <User className="h-5 w-5 text-white" />
              ) : (
                (user?.name || 'U').charAt(0).toUpperCase()
              )}
            </AvatarFallback>
          </Avatar>
          {/* Active indicator dot */}
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black/30 rounded-full"></span>
        </div>
      </button>

      {/* Dropdown Menu - Rendered via Portal */}
      {isOpen &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed w-64 rounded-lg bg-gray-900/95 backdrop-blur-md border border-white/10 shadow-xl overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-2 duration-200"
            style={{
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`,
            }}
          >
            {/* User Info Section */}
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-400 truncate">
                {user?.email || user?.phoneNumber || ''}
              </p>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {/* Profile Link */}
              <Link
                href={profileRoute}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 transition-colors',
                  theme.hover
                )}
              >
                <span className="text-lg">👤</span>
                <span>My Profile</span>
              </Link>

              {/* Settings Link (if provided) */}
              {settingsRoute && (
                <Link
                  href={settingsRoute}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 transition-colors',
                    theme.hover
                  )}
                >
                  <span className="text-lg">⚙️</span>
                  <span>Settings</span>
                </Link>
              )}

              {/* Divider */}
              <div className="my-2 border-t border-white/10"></div>

              {/* Logout Button */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <span className="text-lg">🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
