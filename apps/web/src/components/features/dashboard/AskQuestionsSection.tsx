/**
 * Ask Questions Section Component
 * Left section with category selection, predefined questions, and jyotish dropdown
 */

'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button, LoadingButton } from '@jyotish/ui';
import { useRouter } from 'next/navigation';
import { QUERY_KEYS, ROUTE_BUILDERS } from '@/constants';
import { JyotishSelector } from './JyotishSelector';
import { useChat } from '@/hooks/useChat';
import { checkClientProfileCompletion } from '@/utils/profile-completion';
import { useAuthStore } from '@/store/auth-store';
import { ProfileIncompleteDialog } from '@/components/ui/ProfileIncompleteDialog';
import { CoinPurchaseModal } from '@/components/modals';
import {
  QUESTION_CATEGORIES,
  type QuestionCategory,
} from '@/constants/questionCategories.constants';
import { useSocket } from '@/hooks/useSocket';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { JyotishMatchingModal } from '@/components/ui/JyotishMatchingModal';
import { BROADCAST_MESSAGE_EXPIRY_MS } from '@/constants/broadcastMessage.constants';

export function AskQuestionsSection() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { socket, isConnected } = useSocket();
  const [selectedAstrologerId, setSelectedAstrologerId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [showProfileIncompleteDialog, setShowProfileIncompleteDialog] = useState(false);
  const [missingProfileFields, setMissingProfileFields] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isWaitingForAcceptance, setIsWaitingForAcceptance] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<{ createdAt: string; id: string } | null>(
    null
  );
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [requiredCoins, setRequiredCoins] = useState(1);
  const [showCoinPurchaseModal, setShowCoinPurchaseModal] = useState(false);
  const queryClient = useQueryClient();
  const { startChat } = useChat();

  const selectedCategoryData = QUESTION_CATEGORIES.find((c) => c.id === selectedCategory);

  const handleAstrologerSelect = (astrologerId: string) => {
    setSelectedAstrologerId(astrologerId);
    // Clear category and question when selecting a new astrologer
    setSelectedCategory('');
    setSelectedQuestion('');
    setCustomMessage('');
  };

  const handleAstrologerClear = () => {
    setSelectedAstrologerId('');
    setSelectedCategory('');
    setSelectedQuestion('');
    setCustomMessage('');
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedQuestion('');
    setCustomMessage('');
  };

  const handleQuestionSelect = (question: string) => {
    setSelectedQuestion(question);
    setCustomMessage(question);
  };

  const handleCustomMessageChange = (value: string) => {
    setCustomMessage(value);
    setSelectedQuestion('');
  };

  const handleStartChat = async () => {
    if (!selectedAstrologerId || !user) return;

    // Check profile completion
    const profileCheck = checkClientProfileCompletion(user);
    if (!profileCheck.isComplete) {
      setMissingProfileFields(profileCheck.missingFields);
      setShowProfileIncompleteDialog(true);
      return;
    }

    // Start chat
    const chatId = await startChat(selectedAstrologerId);
    if (chatId) {
      router.push(ROUTE_BUILDERS.CHAT_WITH_ID(chatId));
    }
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
        setRequiredCoins(coins);
        setShowCoinPurchaseModal(true);
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
      setCustomMessage('');
      setSelectedQuestion('');
      setSelectedCategory('');
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
  }, [socket, isConnected, router, queryClient, setShowCoinPurchaseModal]);

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
    setIsWaitingForAcceptance(false);
    setPendingMessage(null);
    toast.info('Request cancelled');
  };

  const handleSendBroadcast = async () => {
    if (!user || !socket || !isConnected) {
      toast.error('Not connected. Please refresh the page.');
      return;
    }

    const messageToSend = customMessage.trim() || selectedQuestion.trim();
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

  const finalMessage = customMessage.trim() || selectedQuestion.trim();

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
      <div className={`flex flex-col gap-4 h-full transition-all duration-300 ${selectedAstrologerId ? '' : 'justify-center'}`}>
        <div className="animate-in fade-in slide-in-from-right-4 delay-100">
          <h3 className="text-xl font-bold text-white mb-2">तपाईंको प्रश्न राख्नुहोस्।</h3>
          <p className="text-sm text-gray-400">Select a Jyotish first, then choose your question</p>
        </div>

        {/* Jyotish Selector - Must be selected first */}
        <div className={`transition-all duration-300 ${selectedAstrologerId ? 'animate-in fade-in zoom-in-95' : ''}`}>
          <JyotishSelector
            selectedAstrologerId={selectedAstrologerId}
            onSelect={handleAstrologerSelect}
            onClear={handleAstrologerClear}
          />
        </div>

        {/* Placeholder when no Jyotish selected */}
        {!selectedAstrologerId && (
          <div className="flex flex-col items-center justify-center py-8 px-4 rounded-xl border border-white/10 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-transparent animate-in fade-in delay-200">
            <MessageSquare className="h-12 w-12 text-purple-400/50 mb-3 animate-pulse" />
            <p className="text-sm text-gray-400 text-center">
              Select a Jyotish from the dropdown above to start asking questions
            </p>
          </div>
        )}

        {/* Category and Question Selection - Only show after Jyotish is selected */}
        {selectedAstrologerId && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 delay-200">
            {/* Category Selection */}
            <div className="w-full">
              <label className="text-sm text-gray-300 mb-2 block">Select Category</label>
              <Select value={selectedCategory} onValueChange={handleCategorySelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_CATEGORIES.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <span>{category.emoji}</span>
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Question Selection (if category selected) */}
            {selectedCategoryData && (
              <div className="w-full animate-in fade-in slide-in-from-bottom-4 delay-300">
                <label className="text-sm text-gray-300 mb-2 block">Select Question</label>
                <Select value={selectedQuestion} onValueChange={handleQuestionSelect}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a question or type your own" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {selectedCategoryData.questions.map((question, index) => (
                      <SelectItem key={index} value={question}>
                        {question}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Custom Message Input */}
            <div className="w-full animate-in fade-in slide-in-from-bottom-4 delay-400">
              <label className="text-sm text-gray-300 mb-2 block">
                {selectedQuestion ? 'Edit Question' : 'Or Type Your Question'}
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => handleCustomMessageChange(e.target.value)}
                placeholder={selectedQuestion ? selectedQuestion : 'Type your question here...'}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[80px] resize-none"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className={`flex gap-2 ${selectedAstrologerId ? 'mt-auto' : 'mt-4'}`}>
          {selectedAstrologerId && (
            <Button
              onClick={handleStartChat}
              disabled={!selectedAstrologerId}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 transition-all font-medium"
            >
              <MessageSquare className="h-4 w-4" />
              Start Chat
            </Button>
          )}
          <LoadingButton
            onClick={handleSendBroadcast}
            disabled={!finalMessage || !selectedAstrologerId}
            loading={isSending}
            loadingText="Sending..."
            className={`${selectedAstrologerId ? 'flex-1' : 'w-full'} bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 transition-all font-medium`}
          >
            <MessageSquare className="h-4 w-4" />
            Send Broadcast
          </LoadingButton>
        </div>
      </div>

      {/* Profile Incomplete Dialog */}
      <ProfileIncompleteDialog
        isOpen={showProfileIncompleteDialog}
        onClose={() => setShowProfileIncompleteDialog(false)}
        missingFields={missingProfileFields}
      />

      {/* Coin Purchase Modal */}
      <CoinPurchaseModal
        isOpen={showCoinPurchaseModal}
        onClose={() => setShowCoinPurchaseModal(false)}
        requiredCoins={requiredCoins}
        onPurchaseSuccess={() => {
          setShowCoinPurchaseModal(false);
        }}
        mode="insufficient"
      />
    </>
  );
}
