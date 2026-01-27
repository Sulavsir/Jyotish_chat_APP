/**
 * Simple Request Chat Button
 * Normal button without animated cursor for dashboard use
 */

'use client';

import React from 'react';
import { LoadingButton } from '@jyotish/ui';
import { MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { ROUTES } from '@/constants';

export function SimpleRequestChatButton() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const handleClick = () => {
    if (!isAuthenticated) {
      router.push(ROUTES.LOGIN);
      return;
    }
    // Navigate to chat page or trigger the broadcast chat
    router.push(ROUTES.CHAT);
  };

  return (
    <LoadingButton
      onClick={handleClick}
      className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-500 hover:via-pink-500 hover:to-red-500 text-white border-0 rounded-full px-6 py-2.5 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group overflow-hidden"
    >
      {/* Animated background shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      {/* Button content */}
      <MessageSquare className="h-5 w-5 relative z-10 animate-pulse group-hover:animate-none group-hover:scale-110 transition-transform duration-300" />
      <span className="relative z-10 inline-block overflow-hidden">
        <span className="relative inline-block text-white">
          Start Live Chat with Jyotish
          {/* Shimmer overlay effect */}
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer pointer-events-none" />
        </span>
      </span>
    </LoadingButton>
  );
}
