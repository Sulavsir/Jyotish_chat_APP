/**
 * Ask Questions Section Component
 * Left section with category selection, predefined questions, and jyotish dropdown
 */

'use client';

import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  LoadingButton,
} from '@jyotish/ui';
import { useRouter } from 'next/navigation';
import { QUERY_KEYS, ROUTE_BUILDERS } from '@/constants';
import { JyotishSelector } from './JyotishSelector';
import { useChat, CoinPurchaseModalWrapper } from '@/hooks/useChat';
import { checkClientProfileCompletion } from '@/utils/profile-completion';
import { useAuthStore } from '@/store/auth-store';
import { ProfileIncompleteDialog } from '@/components/ui/ProfileIncompleteDialog';
import { CoinPurchaseModal } from '@/components/modals';
import { useQuery, useMutation } from '@tanstack/react-query';
import type { QuestionnaireCategory } from '@jyotish/shared';
import { questionnaireService } from '@/services/questionnaire.service';
import { useSocket } from '@/hooks/useSocket';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { JyotishMatchingModal } from '@/components/ui/JyotishMatchingModal';
import { BROADCAST_MESSAGE_EXPIRY_MS } from '@/constants/broadcastMessage.constants';
import { useAskQuestionsLayoutStore } from '@/store/ask-questions-layout.store';
import broadcastMessageService from '@/services/broadcastMessage.service';

export function AskQuestionsSection() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { socket, isConnected } = useSocket();
  const [mode, setMode] = useState<'direct' | 'broadcast'>('direct');
  const [selectedAstrologerId, setSelectedAstrologerId] = useState<string>('');
  const { setShowExtraInfoCards } = useAskQuestionsLayoutStore();

  // Direct-chat tab state
  const [directCategory, setDirectCategory] = useState<string>('');
  const [directQuestion, setDirectQuestion] = useState<string>('');
  const [directMessage, setDirectMessage] = useState('');

  // Broadcast tab state
  const [broadcastCategory, setBroadcastCategory] = useState<string>('');
  const [broadcastQuestion, setBroadcastQuestion] = useState<string>('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [showProfileIncompleteDialog, setShowProfileIncompleteDialog] = useState(false);
  const [missingProfileFields, setMissingProfileFields] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isWaitingForAcceptance, setIsWaitingForAcceptance] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<{ createdAt: string; id: string } | null>(
    null
  );
  const [timeRemaining, setTimeRemaining] = useState(0);
  // Broadcast-coin state (for broadcast tab errors)
  const [broadcastRequiredCoins, setBroadcastRequiredCoins] = useState(1);
  const [isBroadcastCoinModalOpen, setIsBroadcastCoinModalOpen] = useState(false);
  const queryClient = useQueryClient();
  // Direct-chat coin state comes from useChat
  const {
    startChat,
    showCoinPurchaseModal: showDirectCoinModal,
    requiredCoins: directRequiredCoins,
    retryChat,
    setShowCoinPurchaseModal: setShowDirectCoinModal,
  } = useChat();

  const cancelBroadcastMutation = useMutation({
    mutationFn: (messageId: string) => broadcastMessageService.cancelMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BROADCAST.MY_MESSAGES });
      toast.success('Request cancelled. Your coin has been refunded.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel request. You can try again.');
    },
    onSettled: () => {
      setIsWaitingForAcceptance(false);
      setPendingMessage(null);
    },
  });

  // Load question categories and questions from backend (admin-managed)
  const { data: questionnairesData } = useQuery({
    queryKey: [QUERY_KEYS.PUBLIC_QUESTIONNAIRES],
    queryFn: () => questionnaireService.listPublic(),
    staleTime: 5 * 60 * 1000,
  });

  const questionCategories: QuestionnaireCategory[] = questionnairesData?.categories ?? [];

  const directCategoryData = questionCategories.find((c) => c.id === directCategory);
  const broadcastCategoryData = questionCategories.find((c) => c.id === broadcastCategory);

  const handleAstrologerSelect = (astrologerId: string) => {
    setSelectedAstrologerId(astrologerId);
    // Clear category and question when selecting a new astrologer
    setDirectCategory('');
    setDirectQuestion('');
    setDirectMessage('');
  };

  const handleAstrologerClear = () => {
    setSelectedAstrologerId('');
    setDirectCategory('');
    setDirectQuestion('');
    setDirectMessage('');
  };

  // Direct tab handlers
  const handleDirectCategorySelect = (categoryId: string) => {
    setDirectCategory(categoryId);
    setDirectQuestion('');
    setDirectMessage('');
  };

  const handleDirectQuestionSelect = (question: string) => {
    setDirectQuestion(question);
    setDirectMessage(question);
  };

  const handleDirectMessageChange = (value: string) => {
    setDirectMessage(value);
    setDirectQuestion('');
  };

  // Broadcast tab handlers
  const handleBroadcastCategorySelect = (categoryId: string) => {
    setBroadcastCategory(categoryId);
    setBroadcastQuestion('');
    setBroadcastMessage('');
  };

  const handleBroadcastQuestionSelect = (question: string) => {
    setBroadcastQuestion(question);
    setBroadcastMessage(question);
  };

  const handleBroadcastMessageChange = (value: string) => {
    setBroadcastMessage(value);
    setBroadcastQuestion('');
  };

  // Expose when extra info cards on the left side should be visible
  React.useEffect(() => {
    const shouldShow = (mode === 'direct' && !!selectedAstrologerId) || mode === 'broadcast';
    setShowExtraInfoCards(shouldShow);
  }, [mode, selectedAstrologerId, setShowExtraInfoCards]);

  const handleStartChat = async () => {
    if (!selectedAstrologerId || !user) return;

    // Check profile completion
    const profileCheck = checkClientProfileCompletion(user);
    if (!profileCheck.isComplete) {
      setMissingProfileFields(profileCheck.missingFields);
      setShowProfileIncompleteDialog(true);
      return;
    }

    // Start chat and send the selected/custom question as the first message
    const messageToSend = directMessage.trim() || directQuestion.trim();
    await startChat(selectedAstrologerId, undefined, messageToSend, directCategory || undefined);
  };

  // Socket event handlers
  React.useEffect(() => {
    if (!socket || !isConnected) return;

    const handleMessageSent = (message: { createdAt: string; id: string }) => {
      setIsSending(false);
      setIsWaitingForAcceptance(true);
      setPendingMessage(message);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
      // Don't clear the form yet - let user see what they sent
    };

    const handleError = (error: { message: string }) => {
      setIsSending(false);
      setIsWaitingForAcceptance(false);
      setPendingMessage(null);
      const errorMsg = error.message || 'Failed to send message';

      // Check for insufficient coins
      if (errorMsg.includes('Insufficient coins') || errorMsg.includes('Required:')) {
        const coins = extractRequiredCoins(errorMsg);
        setBroadcastRequiredCoins(coins);
        setIsBroadcastCoinModalOpen(true);
        toast.error(errorMsg, {
          duration: 5000,
          description: 'Please top up your coins to send a broadcast message.',
        });
      } else if (errorMsg.includes('complete your profile')) {
        toast.error('Please complete your profile first');
      } else {
        toast.error(errorMsg);
      }
    };

    const handleMessageAccepted = (data: {
      chatId: string;
      message: { id: string; createdAt: string };
    }) => {
      setIsWaitingForAcceptance(false);
      setPendingMessage(null);
      setBroadcastMessage('');
      setBroadcastQuestion('');
      setBroadcastCategory('');
      router.push(ROUTE_BUILDERS.CHAT_WITH_ID(data.chatId));
    };

    socket.on('broadcast:messageSent', handleMessageSent);
    socket.on('broadcast:error', handleError);
    socket.on('broadcast:yourMessageAccepted', handleMessageAccepted);

    return () => {
      socket.off('broadcast:messageSent', handleMessageSent);
      socket.off('broadcast:error', handleError);
      socket.off('broadcast:yourMessageAccepted', handleMessageAccepted);
    };
  }, [socket, isConnected, router, queryClient]);

  const extractRequiredCoins = (errorMessage: string): number => {
    const match = errorMessage.match(/Required:\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : 1;
  };

  // Calculate time remaining for pending message
  React.useEffect(() => {
    if (!pendingMessage) {
      setTimeRemaining(0);
      return;
    }

    const updateTimeRemaining = () => {
      const createdAt = new Date(pendingMessage.createdAt).getTime();
      const expiresAt = createdAt + BROADCAST_MESSAGE_EXPIRY_MS;
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        setIsWaitingForAcceptance(false);
        setPendingMessage(null);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [pendingMessage]);

  // Close modal if message expires
  React.useEffect(() => {
    if (pendingMessage) {
      const createdAt = new Date(pendingMessage.createdAt).getTime();
      const expiresAt = createdAt + BROADCAST_MESSAGE_EXPIRY_MS;
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;

      if (timeUntilExpiry <= 0) {
        setIsWaitingForAcceptance(false);
        setPendingMessage(null);
        return;
      }

      const timeout = setTimeout(() => {
        setIsWaitingForAcceptance(false);
        setPendingMessage(null);
      }, timeUntilExpiry);

      return () => clearTimeout(timeout);
    } else {
      setIsWaitingForAcceptance(false);
    }
  }, [pendingMessage]);

  const handleCancelRequest = () => {
    if (pendingMessage?.id) {
      cancelBroadcastMutation.mutate(pendingMessage.id);
    } else {
      setIsWaitingForAcceptance(false);
      setPendingMessage(null);
      toast.info('Request cancelled');
    }
  };

  const handleSendBroadcast = async () => {
    if (!user || !socket || !isConnected) {
      toast.error('Not connected. Please refresh the page.');
      return;
    }

    const messageToSend = broadcastMessage.trim() || broadcastQuestion.trim();
    if (!messageToSend) {
      toast.error('Please select a question or type your message');
      return;
    }

    // Check profile completion
    const profileCheck = checkClientProfileCompletion(user);
    if (!profileCheck.isComplete) {
      setMissingProfileFields(profileCheck.missingFields);
      setShowProfileIncompleteDialog(true);
      return;
    }

    try {
      setIsSending(true);
      socket.emit('broadcast:sendMessage', {
        content: messageToSend,
        type: 'TEXT',
      });
    } catch (error) {
      console.error('Error sending broadcast message:', error);
      toast.error('Failed to send message');
      setIsSending(false);
    }
  };

  const finalBroadcastMessage = broadcastMessage.trim() || broadcastQuestion.trim();

  // If waiting for acceptance, show matching modal
  if (isWaitingForAcceptance && pendingMessage) {
    return (
      <>
        <JyotishMatchingModal
          isOpen={isWaitingForAcceptance && !!pendingMessage}
          onCancel={handleCancelRequest}
          timeRemaining={timeRemaining}
          title="Searching for Available Jyotish"
          subtitle="Your message has been broadcasted. Waiting for an astrologer to accept..."
        />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 h-full transition-all duration-300">
        {/* Header */}
        <div className="animate-in fade-in slide-in-from-right-4 delay-100">
          <h3 className="text-xl font-bold text-white mb-2">तपाईंको प्रश्न राख्नुहोस्।</h3>
          <p className="text-sm text-gray-400">
            Choose how you want to reach Jyotish: one-on-one or broadcast to everyone.
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="mt-1 mb-2">
          <div className="inline-flex rounded-full bg-white/5 p-1 border border-white/10 shadow-sm">
            <button
              type="button"
              onClick={() => setMode('direct')}
              className={`px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all duration-300 flex items-center gap-1.5 ${
                mode === 'direct'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/40 scale-[1.02]'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.35)]" />
              Chat with specific Jyotish
            </button>
            <button
              type="button"
              onClick={() => setMode('broadcast')}
              className={`ml-1 px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all duration-300 flex items-center gap-1.5 ${
                mode === 'broadcast'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/40 scale-[1.02]'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-orange-500/20 border border-orange-400/60 text-[10px] text-orange-200">
                All
              </span>
              Publish to all Jyotish
            </button>
          </div>
        </div>

        {/* Direct Chat Mode */}
        {mode === 'direct' && (
          <>
            {/* Jyotish Selector */}
            <div
              className={`transition-all duration-300 ${
                selectedAstrologerId ? 'animate-in fade-in zoom-in-95' : ''
              }`}
            >
              <JyotishSelector
                selectedAstrologerId={selectedAstrologerId}
                onSelect={handleAstrologerSelect}
                onClear={handleAstrologerClear}
              />
            </div>

            {/* Placeholder when no Jyotish selected */}
            {!selectedAstrologerId && (
              <div className="flex flex-col items-center justify-center py-6 px-4 rounded-xl border border-white/10 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-transparent animate-in fade-in delay-200">
                <MessageSquare className="h-10 w-10 text-purple-400/60 mb-2 animate-pulse" />
                <p className="text-sm text-gray-300 text-center">
                  Select a Jyotish from the dropdown above to start a private chat.
                </p>
              </div>
            )}

            {selectedAstrologerId && (
              <>
                {/* Category, Question & Message (direct tab) */}
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 delay-200">
                  {/* Category Selection */}
                  <div className="w-full">
                    <label className="text-sm text-gray-300 mb-2 block">Select Category</label>
                    <Select
                      value={directCategory}
                      onValueChange={(value) =>
                        value === 'CLEAR'
                          ? handleDirectCategorySelect('')
                          : handleDirectCategorySelect(value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CLEAR">
                          <span className="text-gray-400">Clear selection</span>
                        </SelectItem>
                        {questionCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              {category.emoji && <span>{category.emoji}</span>}
                              <span>{category.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Question Selection (if category selected) */}
                  {directCategoryData && (
                    <div className="w-full animate-in fade-in slide-in-from-bottom-4 delay-300">
                      <label className="text-sm text-gray-300 mb-2 block">Select Question</label>
                      <Select
                        value={directQuestion}
                        onValueChange={(value) => {
                          if (value === 'CLEAR_QUESTION') {
                            setDirectQuestion('');
                            setDirectMessage('');
                          } else {
                            handleDirectQuestionSelect(value);
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a question or type your own" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] [&_[data-radix-select-scroll-up-button]]:hidden [&_[data-radix-select-scroll-down-button]]:hidden">
                          <SelectItem value="CLEAR_QUESTION">
                            <span className="text-gray-400">Clear question</span>
                          </SelectItem>
                          {directCategoryData.questions.map((question) => (
                            <SelectItem key={question.id} value={question.text}>
                              {question.text}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Custom Message Input */}
                  <div className="w-full animate-in fade-in slide-in-from-bottom-4 delay-400">
                    <label className="text-sm text-gray-300 mb-2 block">
                      {directQuestion
                        ? 'Edit question before sending to this Jyotish'
                        : 'Type your question for this Jyotish'}
                    </label>
                    <textarea
                      value={directMessage}
                      onChange={(e) => handleDirectMessageChange(e.target.value)}
                      placeholder={
                        directQuestion ? directQuestion : 'Type your question for this Jyotish...'
                      }
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[80px] resize-none"
                    />
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex gap-2 mt-auto">
                  <Button
                    onClick={handleStartChat}
                    disabled={!selectedAstrologerId}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 transition-all font-medium"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Start Chat
                  </Button>
                </div>
              </>
            )}
          </>
        )}

        {/* Broadcast Mode */}
        {mode === 'broadcast' && (
          <>
            {/* Info card */}
            <div className="flex flex-col gap-2 py-4 px-4 rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-red-500/10 to-transparent animate-in fade-in delay-150">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-orange-400 animate-pulse" />
                <p className="text-sm font-medium text-orange-100">
                  Your question will be published to all available Jyotish.
                </p>
              </div>
              <p className="text-xs text-orange-200/80">
                The first astrologer to accept will start a private chat with you. Make your
                question clear so the right Jyotish can respond.
              </p>
            </div>

            {/* Category, Question & Message (broadcast tab) */}
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 delay-200">
              {/* Category Selection */}
              <div className="w-full">
                <label className="text-sm text-gray-300 mb-2 block">Select Category</label>
                <Select
                  value={broadcastCategory}
                  onValueChange={(value) =>
                    value === 'CLEAR'
                      ? handleBroadcastCategorySelect('')
                      : handleBroadcastCategorySelect(value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLEAR">
                      <span className="text-gray-400">Clear selection</span>
                    </SelectItem>
                    {questionCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          {category.emoji && <span>{category.emoji}</span>}
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Question Selection (if category selected) */}
              {broadcastCategoryData && (
                <div className="w-full animate-in fade-in slide-in-from-bottom-4 delay-300">
                  <label className="text-sm text-gray-300 mb-2 block">Select Question</label>
                  <Select
                    value={broadcastQuestion}
                    onValueChange={(value) => {
                      if (value === 'CLEAR_QUESTION') {
                        setBroadcastQuestion('');
                        setBroadcastMessage('');
                      } else {
                        handleBroadcastQuestionSelect(value);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a question or type your own" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] [&_[data-radix-select-scroll-up-button]]:hidden [&_[data-radix-select-scroll-down-button]]:hidden">
                      <SelectItem value="CLEAR_QUESTION">
                        <span className="text-gray-400">Clear question</span>
                      </SelectItem>
                      {broadcastCategoryData.questions.map((question) => (
                        <SelectItem key={question.id} value={question.text}>
                          {question.text}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Custom Message Input */}
              <div className="w-full animate-in fade-in slide-in-from-bottom-4 delay-400">
                <label className="text-sm text-gray-300 mb-2 block">
                  {broadcastQuestion
                    ? 'Edit question before publishing to all Jyotish'
                    : 'Type your question to publish to all Jyotish'}
                </label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => handleBroadcastMessageChange(e.target.value)}
                  placeholder={
                    broadcastQuestion
                      ? broadcastQuestion
                      : 'Type your question to publish to all Jyotish...'
                  }
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[80px] resize-none"
                />
              </div>
            </div>

            {/* Broadcast Button */}
            <div className="flex gap-2 mt-auto">
              <LoadingButton
                onClick={handleSendBroadcast}
                disabled={!finalBroadcastMessage}
                loading={isSending}
                loadingText="Sending..."
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 transition-all font-medium"
              >
                <MessageSquare className="h-4 w-4" />
                Publish Message to All Jyotish
              </LoadingButton>
            </div>
          </>
        )}
      </div>

      {/* Profile Incomplete Dialog */}
      <ProfileIncompleteDialog
        isOpen={showProfileIncompleteDialog}
        onClose={() => setShowProfileIncompleteDialog(false)}
        missingFields={missingProfileFields}
      />

      {/* Broadcast Coin Purchase Modal (for broadcast tab insufficient coins) */}
      <CoinPurchaseModal
        isOpen={isBroadcastCoinModalOpen}
        onClose={() => setIsBroadcastCoinModalOpen(false)}
        requiredCoins={broadcastRequiredCoins}
        onPurchaseSuccess={() => {
          setIsBroadcastCoinModalOpen(false);
        }}
        mode="insufficient"
      />

      {/* Direct-chat coin purchase modal (for starting chat with specific Jyotish) */}
      <CoinPurchaseModalWrapper
        isOpen={showDirectCoinModal}
        onClose={() => setShowDirectCoinModal(false)}
        requiredCoins={directRequiredCoins}
        onPurchaseSuccess={retryChat}
      />
    </>
  );
}
