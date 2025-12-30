/**
 * StartChatButton - Button to initiate a chat with a user
 */

import React from 'react';
import { Button } from '@jyotish/ui';
import { MessageCircle } from 'lucide-react';
import { useChat } from '@/hooks/useChat';

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

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await startChat(userId, consultationId);
  };

  return (
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
  );
};
