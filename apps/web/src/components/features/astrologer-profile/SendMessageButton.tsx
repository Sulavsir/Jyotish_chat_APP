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
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@jyotish/ui';

interface SendMessageButtonProps {
  astrologerId: string;
  astrologerName?: string;
  chatMessageFee?: number | null;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function SendMessageButton({
  astrologerId,
  astrologerName,
  chatMessageFee,
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
  const [showFeeConfirm, setShowFeeConfirm] = useState(false);

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

    // Fee confirmation for direct chat (client-side UX only, backend validation remains).
    if (user?.role === UserRole.CLIENT && (chatMessageFee ?? 0) > 0) {
      setShowFeeConfirm(true);
      return;
    }

    await startChat(astrologerId);
  };

  const confirmStartChat = async () => {
    setShowFeeConfirm(false);
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

      {/* Balance / Top-up Modal */}
      <CoinPurchaseModalWrapper
        isOpen={showCoinPurchaseModal}
        onClose={() => setShowCoinPurchaseModal(false)}
        requiredCoins={requiredCoins}
        onPurchaseSuccess={retryChat}
      />

      <Dialog open={showFeeConfirm} onOpenChange={setShowFeeConfirm}>
        <DialogContent className="max-w-md border border-white/10 bg-slate-900/95 backdrop-blur-md text-white">
          <DialogHeader>
            <DialogTitle className="text-left">Direct Chat Confirmation</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-gray-300">
            Are you sure you want to spend{' '}
            <span className="font-semibold">Nrs.{chatMessageFee ?? 0}</span> to communicate with
            this Jyotish?
          </p>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowFeeConfirm(false)}
              disabled={isStartingChat}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void confirmStartChat()}
              disabled={isStartingChat}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
            >
              Yes, start chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
