/**
 * Send Message Button Component
 * Opens chat with a specific astrologer
 */

'use client';

import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { LoadingButton } from '@/components/ui';
import { useChat, CoinPurchaseModalWrapper } from '@/hooks/useChat';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants';
import { ProfileIncompleteDialog } from '@/components/ui/ProfileIncompleteDialog';
import { checkClientProfileCompletion } from '@/utils/profile-completion';
import { UserRole } from '@/types';

interface SendMessageButtonProps {
  astrologerId: string;
  astrologerName?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function SendMessageButton({
  astrologerId,
  astrologerName,
  variant = 'default',
  size = 'default',
  className = '',
}: SendMessageButtonProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const {
    startChat,
    isStartingChat,
    showCoinPurchaseModal,
    requiredCoins,
    retryChat,
    setShowCoinPurchaseModal,
  } = useChat();
  const [showProfileIncompleteDialog, setShowProfileIncompleteDialog] = useState(false);
  const [missingProfileFields, setMissingProfileFields] = useState<string[]>([]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check authentication first
    if (!isAuthenticated) {
      router.push(ROUTES.LOGIN);
      return;
    }

    // Check if client profile is complete before starting chat
    if (user?.role === UserRole.CLIENT) {
      const profileCheck = checkClientProfileCompletion(user);
      if (!profileCheck.isComplete) {
        setMissingProfileFields(profileCheck.missingFields);
        setShowProfileIncompleteDialog(true);
        return;
      }
    }

    await startChat(astrologerId);
  };

  return (
    <>
      <LoadingButton
        onClick={handleClick}
        isLoading={isStartingChat}
        loadingText="Starting..."
        variant={variant}
        size={size}
        className={className}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Send Message
      </LoadingButton>

      {/* Profile Incomplete Dialog */}
      <ProfileIncompleteDialog
        isOpen={showProfileIncompleteDialog}
        onClose={() => setShowProfileIncompleteDialog(false)}
        missingFields={missingProfileFields}
      />

      {/* Coin Purchase Modal */}
      <CoinPurchaseModalWrapper
        isOpen={showCoinPurchaseModal}
        onClose={() => setShowCoinPurchaseModal(false)}
        requiredCoins={requiredCoins}
        onPurchaseSuccess={retryChat}
      />
    </>
  );
}
