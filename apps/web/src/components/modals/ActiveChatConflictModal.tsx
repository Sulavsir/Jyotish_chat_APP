'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  LoadingButton,
} from '@jyotish/ui';
import { MessageSquare } from 'lucide-react';
import type { Chat } from '@/types/chat';

export interface ActiveChatConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeChat: Chat | null;
  onOpenChat: () => void;
  onEndChatAndContinue: () => void | Promise<void>;
  isEnding?: boolean;
}

export function ActiveChatConflictModal({
  isOpen,
  onClose,
  activeChat,
  onOpenChat,
  onEndChatAndContinue,
  isEnding = false,
}: ActiveChatConflictModalProps) {
  const astrologerName = activeChat?.astrologerParticipant?.name?.trim() || 'your Jyotish';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isEnding && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>You have an active chat</DialogTitle>
          <DialogDescription className="text-left">
            You already have an open conversation with <strong>{astrologerName}</strong>. End that
            chat before starting a new one from Ask Questions, or continue in Chat.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isEnding}>
            Cancel
          </Button>
          <Button type="button" variant="default" onClick={onOpenChat} disabled={isEnding}>
            <MessageSquare className="mr-2 h-4 w-4" aria-hidden />
            Open chat
          </Button>
          <LoadingButton
            type="button"
            onClick={() => void onEndChatAndContinue()}
            loading={isEnding}
          >
            End chat and continue
          </LoadingButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
