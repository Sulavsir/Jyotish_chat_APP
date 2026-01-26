/**
 * Simple Request Chat Button
 * Normal button without animated cursor for dashboard use
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@jyotish/ui';
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
    <Button
      onClick={handleClick}
      className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-full px-6 py-2.5 flex items-center gap-2 font-medium shadow-none"
    >
      <MessageSquare className="h-5 w-5" />
      Start Live Chat with Jotish
    </Button>
  );
}
