/**
 * StartChatButton - Button to initiate a chat with a user
 */

import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { LoadingButton } from '@/components/ui';
import { useChat, CoinPurchaseModalWrapper } from '@/hooks/useChat';
import { useAuthStore } from '@/store/auth-store';
import { UserRole } from '@/types/user.types';
import { ProfileIncompleteDialog } from '@/components/ui/ProfileIncompleteDialog';
import { checkClientProfileCompletion } from '@/utils/profile-completion';

interface StartChatButtonProps {
  userId: string;
  userName?: string;
  consultationId?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'xl' | 'icon';
  fullWidth?: boolean;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export const StartChatButton: React.FC<StartChatButtonProps> = ({
  userId,
  userName,
  consultationId,
  variant = 'default',
  size = 'default',
  fullWidth = false,
  showIcon = true,
  children,
}) => {
  const {
    startChat,
    isStartingChat,
    showCoinPurchaseModal,
    requiredCoins,
    retryChat,
    setShowCoinPurchaseModal,
  } = useChat();
  const user = useAuthStore((state) => state.user);
  const [showProfileIncompleteDialog, setShowProfileIncompleteDialog] = useState(false);
  const [missingProfileFields, setMissingProfileFields] = useState<string[]>([]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if client profile is complete before starting chat
    if (user?.role === UserRole.CLIENT) {
      const profileCheck = checkClientProfileCompletion(user);
      if (!profileCheck.isComplete) {
        setMissingProfileFields(profileCheck.missingFields);
        setShowProfileIncompleteDialog(true);
        return;
      }
    }

    await startChat(userId, consultationId);
  };

  return (
    <>
      <LoadingButton
        onClick={handleClick}
        isLoading={isStartingChat}
        loadingText="Starting..."
        variant={variant}
        size={size}
        className={fullWidth ? 'w-full' : ''}
      >
        {showIcon && <MessageCircle className="h-4 w-4 mr-2" />}
        {children || `Message${userName ? ` ${userName}` : ''}`}
      </LoadingButton>

      {/* Profile Incomplete Dialog */}
      <ProfileIncompleteDialog
        isOpen={showProfileIncompleteDialog}
        onClose={() => setShowProfileIncompleteDialog(false)}
        missingFields={missingProfileFields}
      />
      <CoinPurchaseModalWrapper
        isOpen={showCoinPurchaseModal}
        onClose={() => setShowCoinPurchaseModal(false)}
        requiredCoins={requiredCoins}
        onPurchaseSuccess={retryChat}
      />
    </>
  );
};
