/**
 * Request Instant Chat Button
 * Allows clients to request instant chat with any available astrologer.
 * Flow: check coins first (1 required) → open modal (profile select, category/question, send).
 * Birth details sent to Jyotish are from the selected profile (Me or family/friend).
 * Uses shared useBroadcastPending hook (same as Publish to all Jyotish) so cancel always hits the API.
 */

'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@jyotish/ui';
import { MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ROUTES, QUERY_KEYS } from '@/constants';
import { useAuthStore } from '@/store/auth-store';
import { AnimatedCursorButton } from '@/components/ui/AnimatedCursorButton';
import { ProfileIncompleteDialog } from '@/components/ui/ProfileIncompleteDialog';
import { checkClientProfileCompletion } from '@/utils/profile-completion';
import { CoinPurchaseModal } from '@/components/modals';
import chatService from '@/services/chat.service';
import { coinService } from '@/services/coin.service';
import { RequestInstantChatModal } from './RequestInstantChatModal';
import { toast } from 'sonner';
import { useBroadcastPending } from '@/hooks/useBroadcastPending';
import { useCoinRates } from '@/hooks/useCoinRates';

export const RequestInstantChatButton: React.FC = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { rates } = useCoinRates(isAuthenticated);
  const broadcastSendCoins = rates?.BROADCAST_SEND;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showProfileIncompleteDialog, setShowProfileIncompleteDialog] = useState(false);
  const [missingProfileFields, setMissingProfileFields] = useState<string[]>([]);
  const [showCoinPurchaseModal, setShowCoinPurchaseModal] = useState(false);
  const [requiredCoins, setRequiredCoins] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { isSending, setIsSending, isWaitingForAcceptance, markSending, clearWaiting } =
    useBroadcastPending({
      onInsufficientCoins: (coins) => {
        setRequiredCoins(coins);
        setShowCoinPurchaseModal(true);
      },
    });

  const { data: balanceData } = useQuery({
    queryKey: QUERY_KEYS.COINS.BALANCE,
    queryFn: () => coinService.getBalance(),
  });
  const balance = balanceData?.balance ?? 0;

  const handleButtonClick = async () => {
    if (!isAuthenticated) {
      router.push(ROUTES.LOGIN);
      return;
    }

    // Guard: prevent sending when a broadcast is already pending
    if (isWaitingForAcceptance) {
      toast.error(
        'You already have a pending broadcast. Please wait for it to be accepted or expire before sending another one.'
      );
      return;
    }

    if (broadcastSendCoins != null && broadcastSendCoins > 0 && balance < broadcastSendCoins) {
      setRequiredCoins(broadcastSendCoins);
      setShowCoinPurchaseModal(true);
      toast.error('Insufficient balance', {
        description: `Request Instant Chat requires minimum ${broadcastSendCoins} NRs. Please top up your balance.`,
        duration: 5000,
      });
      return;
    }
    try {
      const activeChat = await chatService.getActiveChat();
      if (activeChat) {
        toast.error('You have an active chat. End your current chat before starting a new one.', {
          description: 'End your current chat before starting a new one.',
          duration: 5000,
        });
        return;
      }
    } catch {
      // Ignore; allow user to proceed
    }
    const profileCheck = checkClientProfileCompletion(user);
    if (!profileCheck.isComplete) {
      setMissingProfileFields(profileCheck.missingFields);
      setShowProfileIncompleteDialog(true);
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <>
      <AnimatedCursorButton
        targetButtonRef={buttonRef}
        delay={1500}
        showOnce={false}
        repeatInterval={6000}
        startPosition="middle"
        cursorColor="#FFFFFF"
        highlightColor="#d8287c"
      />
      <Button
        ref={buttonRef}
        onClick={handleButtonClick}
        disabled={isWaitingForAcceptance}
        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg relative disabled:opacity-50 disabled:cursor-not-allowed"
        size="lg"
      >
        <MessageSquare className="mr-2 h-5 w-5" />
        Request Instant Chat
      </Button>

      <RequestInstantChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSendSuccess={() => setIsModalOpen(false)}
        onSendRequested={() => {
          setIsModalOpen(false);
          markSending();
        }}
        isSending={isSending}
        setIsSending={setIsSending}
        coinCost={broadcastSendCoins}
        clearWaiting={clearWaiting}
      />

      <ProfileIncompleteDialog
        isOpen={showProfileIncompleteDialog}
        onClose={() => setShowProfileIncompleteDialog(false)}
        missingFields={missingProfileFields}
      />

      <CoinPurchaseModal
        isOpen={showCoinPurchaseModal}
        onClose={() => setShowCoinPurchaseModal(false)}
        requiredCoins={requiredCoins}
        onPurchaseSuccess={() => setShowCoinPurchaseModal(false)}
        mode="insufficient"
      />
    </>
  );
};
