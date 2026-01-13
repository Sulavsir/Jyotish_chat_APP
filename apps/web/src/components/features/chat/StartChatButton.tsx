/**
 * StartChatButton - Button to initiate a chat with a user
 */

import React, { useState } from 'react';
import { Button } from '@jyotish/ui';
import { MessageCircle } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
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
  const { startChat, isStartingChat } = useChat();
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
      <Button
        onClick={handleClick}
        disabled={isStartingChat}
        variant={variant}
        size={size}
        className={fullWidth ? 'w-full' : ''}
      >
        {showIcon && <MessageCircle className="h-4 w-4 mr-2" />}
        {children || (isStartingChat ? 'Starting...' : `Message${userName ? ` ${userName}` : ''}`)}
      </Button>

      {/* Profile Incomplete Dialog */}
      <ProfileIncompleteDialog
        isOpen={showProfileIncompleteDialog}
        onClose={() => setShowProfileIncompleteDialog(false)}
        missingFields={missingProfileFields}
      />
    </>
  );
};
