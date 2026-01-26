/**
 * Ask Questions Section Component
 * Left section with category selection, predefined questions, and jyotish dropdown
 */

'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MessageSquare, ChevronDown, X, XCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Skeleton,
  Button,
} from '@jyotish/ui';
import { useRouter } from 'next/navigation';
import { QUERY_KEYS, ROUTE_BUILDERS } from '@/constants';
import { getImageUrl } from '@/utils/image.utils';
import astrologerService from '@/services/astrologer.service';
import type { PublicAstrologerProfile } from '@/types/astrologer';
import { ASTROLOGER_CATEGORY_LABELS } from '@/types/astrologer';
import { useChat } from '@/hooks/useChat';
import { checkClientProfileCompletion } from '@/utils/profile-completion';
import { useAuthStore } from '@/store/auth-store';
import { ProfileIncompleteDialog } from '@/components/ui/ProfileIncompleteDialog';
import { CoinPurchaseModal } from '@/components/modals';
import { QUESTION_CATEGORIES, type QuestionCategory } from '@/constants/questionCategories.constants';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showProfileIncompleteDialog, setShowProfileIncompleteDialog] = useState(false);
  const [missingProfileFields, setMissingProfileFields] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isWaitingForAcceptance, setIsWaitingForAcceptance] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [requiredCoins, setRequiredCoins] = useState(1);
  const [showCoinPurchaseModal, setShowCoinPurchaseModal] = useState(false);
  const queryClient = useQueryClient();
  const { startChat } = useChat();

  // Fetch astrologers list
  const { data: astrologersData, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.ASTROLOGERS.LIST({}), searchTerm],
    queryFn: () =>
      astrologerService.listAstrologers({
        isOnline: true,
        search: searchTerm || undefined,
        limit: 50,
      }),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const astrologers = astrologersData?.astrologers || [];
  const selectedAstrologer = astrologers.find((a) => a.id === selectedAstrologerId);
  const selectedCategoryData = QUESTION_CATEGORIES.find((c) => c.id === selectedCategory);

  // Filter astrologers based on search
  const filteredAstrologers = astrologers.filter((astrologer) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      astrologer.name.toLowerCase().includes(search) ||
      astrologer.category.toLowerCase().includes(search) ||
      astrologer.specialization?.some((s) => s.toLowerCase().includes(search))
    );
  });

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

    const handleMessageSent = (message: any) => {
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

    const handleMessageAccepted = (data: { chatId: string; message: any }) => {
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
      <div className="flex flex-col gap-4 h-full">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Ask Questions?</h3>
          <p className="text-sm text-gray-400">Select category, question, and Jyotish</p>
        </div>

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
          <div className="w-full">
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
        <div className="w-full">
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

        {/* Jyotish Selector with Search */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-300 block">Select Jyotish</label>
            {selectedAstrologerId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedAstrologerId('');
                }}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <XCircle className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>
          <Select
            value={selectedAstrologerId}
            onValueChange={setSelectedAstrologerId}
            onOpenChange={setIsDropdownOpen}
          >
            <SelectTrigger className="w-full">
              {selectedAstrologer ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Avatar className="h-6 w-6 flex-shrink-0">
                    <AvatarImage
                      src={getImageUrl(selectedAstrologer.profilePhoto) || undefined}
                      alt={selectedAstrologer.name}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white text-xs">
                      {selectedAstrologer.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm truncate">{selectedAstrologer.name}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    ({ASTROLOGER_CATEGORY_LABELS[selectedAstrologer.category]})
                  </span>
                </div>
              ) : (
                <SelectValue placeholder="Select a Jyotish" />
              )}
            </SelectTrigger>
            <SelectContent className="max-h-[400px]">
              {/* Search Input inside Dropdown */}
              <div className="sticky top-0 z-10 bg-slate-950 border-b border-white/10 p-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchTerm('');
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Astrologers List */}
              <div className="max-h-[300px] overflow-y-auto">
                {isLoading ? (
                  <div className="p-4">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : filteredAstrologers.length === 0 ? (
                  <div className="p-4 text-sm text-gray-400 text-center">
                    {searchTerm ? 'No astrologers found' : 'No astrologers available'}
                  </div>
                ) : (
                  filteredAstrologers.map((astrologer) => (
                    <SelectItem key={astrologer.id} value={astrologer.id} className="py-2">
                      <div className="flex items-center gap-3 w-full">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage
                            src={getImageUrl(astrologer.profilePhoto) || undefined}
                            alt={astrologer.name}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white text-xs">
                            {astrologer.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{astrologer.name}</span>
                            {astrologer.isOnline && (
                              <div className="h-2 w-2 bg-green-400 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            {ASTROLOGER_CATEGORY_LABELS[astrologer.category]}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </div>
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-auto">
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
          <Button
            onClick={handleSendBroadcast}
            disabled={!finalMessage || isSending}
            className={`${selectedAstrologerId ? 'flex-1' : 'w-full'} bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 transition-all font-medium`}
          >
            <MessageSquare className="h-4 w-4" />
            {isSending ? 'Sending...' : 'Send Broadcast'}
          </Button>
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
