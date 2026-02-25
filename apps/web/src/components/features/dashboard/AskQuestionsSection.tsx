/**
 * Ask Questions Section Component
 * Left section with category selection, predefined questions, and jyotish dropdown
 */

'use client';

import React, { useState } from 'react';
import { Eye, MessageSquare, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  LoadingButton,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@jyotish/ui';
import { useRouter } from 'next/navigation';
import { QUERY_KEYS, ROUTE_BUILDERS } from '@/constants';
import { JyotishSelector } from './JyotishSelector';
import { useChat, CoinPurchaseModalWrapper } from '@/hooks/useChat';
import { useBroadcastPending } from '@/hooks/useBroadcastPending';
import { checkClientProfileCompletion } from '@/utils/profile-completion';
import { useAuthStore } from '@/store/auth-store';
import { ProfileIncompleteDialog } from '@/components/ui/ProfileIncompleteDialog';
import { CoinPurchaseModal, BroadcastRemainingPayModal } from '@/components/modals';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { QuestionnaireCategory } from '@jyotish/shared';
import { questionnaireService } from '@/services/questionnaire.service';
import broadcastMessageService from '@/services/broadcastMessage.service';
import { useQuestionnaireLanguageStore } from '@/store/questionnaire-language.store';
import { useSocket } from '@/hooks/useSocket';
import { toast } from 'sonner';
import { JyotishMatchingModal } from '@/components/ui/JyotishMatchingModal';
import { useAskQuestionsLayoutStore } from '@/store/ask-questions-layout.store';
import { useTranslations } from '@/hooks/useTranslations';
import chatService from '@/services/chat.service';
import { clientProfileService } from '@/services/clientProfile.service';
import { getBirthDetailsForProfile } from '@/utils/birth-details.utils';
import { SelectProfileModal } from '@/components/modals';
import { SelectProfileSection } from '@/components/profile';
import { useCoinRates } from '@/hooks/useCoinRates';
import coinService from '@/services/coin.service';
import { AstrologerCategory } from '@/types/astrologer';

const ACTIVE_CHAT_ERROR =
  'You have an active chat. End your current chat before starting a new one.';

export function AskQuestionsSection() {
  const { t } = useTranslations();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { socket, isConnected } = useSocket();
  const [mode, setMode] = useState<'direct' | 'broadcast'>('direct');
  const [selectedAstrologerId, setSelectedAstrologerId] = useState<string>('');
  const [selectedAstrologerCategory, setSelectedAstrologerCategory] = useState<
    AstrologerCategory | null
  >(null);
  const { setShowExtraInfoCards } = useAskQuestionsLayoutStore();

  // Direct-chat tab state
  const [directCategory, setDirectCategory] = useState<string>('');
  const [directQuestion, setDirectQuestion] = useState<string>('');
  const [directMessage, setDirectMessage] = useState('');
  const [showDirectProfileModal, setShowDirectProfileModal] = useState(false);

  // Broadcast tab state
  const [broadcastCategory, setBroadcastCategory] = useState<string>('');
  const [broadcastQuestion, setBroadcastQuestion] = useState<string>('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [selectedBroadcastQuestionIds, setSelectedBroadcastQuestionIds] = useState<string[]>([]);
  const [broadcastProfileId, setBroadcastProfileId] = useState<string>('me');
  const [showSelectedQuestionsModal, setShowSelectedQuestionsModal] = useState(false);
  const [prepareResult, setPrepareResult] = useState<{
    totalNr: number;
    remainingNr: number;
    questions: { id: string; text: string }[];
  } | null>(null);
  const [pendingBroadcastBirthDetails, setPendingBroadcastBirthDetails] = useState<
    Record<string, string> | undefined
  >(undefined);
  const [showRemainingPayModal, setShowRemainingPayModal] = useState(false);
  const [directMessageError, setDirectMessageError] = useState<string>('');
  const [broadcastMessageError, setBroadcastMessageError] = useState<string>('');
  const [showProfileIncompleteDialog, setShowProfileIncompleteDialog] = useState(false);
  const [missingProfileFields, setMissingProfileFields] = useState<string[]>([]);
  // Broadcast balance state (for broadcast tab errors)
  const [broadcastRequiredCoins, setBroadcastRequiredCoins] = useState(1);
  const [isBroadcastCoinModalOpen, setIsBroadcastCoinModalOpen] = useState(false);
  const questionnaireLanguage = useQuestionnaireLanguageStore((s) => s.language);
  const queryClient = useQueryClient();
  // Direct-chat coin state comes from useChat
  const {
    startChat,
    showCoinPurchaseModal: showDirectCoinModal,
    requiredCoins: directRequiredCoins,
    setRequiredCoins: setDirectRequiredCoins,
    retryChat,
    setShowCoinPurchaseModal: setShowDirectCoinModal,
  } = useChat();

  const { rates: coinRates } = useCoinRates(mode === 'direct' && !!selectedAstrologerId);
  const { data: balanceData } = useQuery({
    queryKey: QUERY_KEYS.COINS.BALANCE,
    queryFn: () => coinService.getBalance(),
    enabled: mode === 'direct' && !!selectedAstrologerId,
  });
  const coinBalance = balanceData?.balance ?? 0;
  const isAppointmentOnlyDirect =
    selectedAstrologerCategory === AstrologerCategory.PREMIUM ||
    selectedAstrologerCategory === AstrologerCategory.KATHA_VACHAK;
  const requiredCoinsDirect =
    isAppointmentOnlyDirect ? 0 : (coinRates?.CHAT_PER_MESSAGE ?? 0);
  const showInsufficientCoinsBanner =
    !!selectedAstrologerId &&
    requiredCoinsDirect > 0 &&
    coinBalance < requiredCoinsDirect;

  const {
    isSending,
    setIsSending,
    isWaitingForAcceptance,
    pendingMessage,
    timeRemaining,
    markSending,
    handleCancelRequest,
  } = useBroadcastPending({
    onAccepted: (data) => {
      setBroadcastMessage('');
      setBroadcastQuestion('');
      setBroadcastCategory('');
      router.push(ROUTE_BUILDERS.CHAT_WITH_ID(data.chat.id));
    },
    onInsufficientCoins: (coins) => {
      setBroadcastRequiredCoins(coins);
      setIsBroadcastCoinModalOpen(true);
    },
  });

  // Load question categories and questions from backend (admin-managed), filtered by selected language
  const { data: questionnairesData } = useQuery({
    queryKey: [QUERY_KEYS.PUBLIC_QUESTIONNAIRES(questionnaireLanguage)],
    queryFn: () => questionnaireService.listPublic(questionnaireLanguage),
    staleTime: 5 * 60 * 1000,
  });

  const questionCategories: QuestionnaireCategory[] = questionnairesData?.categories ?? [];

  const { data: pricingData } = useQuery({
    queryKey: QUERY_KEYS.BROADCAST.QUESTION_PRICING,
    queryFn: () => broadcastMessageService.getQuestionPricing(),
    enabled: mode === 'broadcast',
  });
  const pricingTiers = pricingData?.tiers ?? [];
  const getTotalNrForCount = (count: number): number => {
    if (count <= 0) return 0;
    const tier = pricingTiers.find((t) => t.questionCount === count);
    if (tier) return tier.amountNr;
    const lower = pricingTiers
      .filter((t) => t.questionCount <= count)
      .sort((a, b) => b.questionCount - a.questionCount)[0];
    if (lower) return Math.round((lower.amountNr / lower.questionCount) * count);
    const first = pricingTiers[0];
    return first ? Math.round((first.amountNr / first.questionCount) * count) : 0;
  };

  const prepareMutation = useMutation({
    mutationFn: (questionIds: string[]) => broadcastMessageService.prepareQuestions(questionIds),
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to prepare questions'),
  });
  const sendQuestionsMutation = useMutation({
    mutationFn: (payload: {
      questionItems: { id: string; text: string }[];
      totalNr: number;
      birthDetails?: Record<string, string>;
    }) => broadcastMessageService.sendQuestions(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BROADCAST.MY_MESSAGES });
      setSelectedBroadcastQuestionIds([]);
      setBroadcastMessage('');
      setBroadcastQuestion('');
      setBroadcastCategory('');
      toast.success(
        `${variables.questionItems.length} question${variables.questionItems.length === 1 ? '' : 's'} published to all Jyotish.`
      );
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to send questions'),
  });

  // Client profiles (Me + family/friends) for profile selection in direct and broadcast
  const { data: profilesData } = useQuery({
    queryKey: QUERY_KEYS.USERS.PROFILES,
    queryFn: () => clientProfileService.list(),
  });
  const familyProfiles = profilesData?.profiles ?? [];

  const directCategoryData = questionCategories.find((c) => c.id === directCategory);
  const broadcastCategoryData = questionCategories.find((c) => c.id === broadcastCategory);
  const selectedQuestionTexts = React.useMemo(() => {
    if (!broadcastCategoryData || selectedBroadcastQuestionIds.length === 0) return [];
    return broadcastCategoryData.questions
      .filter((q) => selectedBroadcastQuestionIds.includes(q.id))
      .map((q) => q.text);
  }, [broadcastCategoryData, selectedBroadcastQuestionIds]);

  const handleAstrologerSelect = (
    astrologerId: string,
    astrologer?: { category: AstrologerCategory }
  ) => {
    setSelectedAstrologerId(astrologerId);
    setSelectedAstrologerCategory(astrologer?.category ?? null);
    setDirectCategory('');
    setDirectQuestion('');
    setDirectMessage('');
  };

  const handleAstrologerClear = () => {
    setSelectedAstrologerId('');
    setSelectedAstrologerCategory(null);
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
    setDirectMessageError('');
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
    setSelectedBroadcastQuestionIds([]);
  };

  const handleBroadcastQuestionToggle = (questionId: string, checked: boolean) => {
    setBroadcastMessageError('');
    setSelectedBroadcastQuestionIds((prev) =>
      checked ? [...prev, questionId] : prev.filter((id) => id !== questionId)
    );
  };

  const handleBroadcastQuestionSelect = (question: string) => {
    setBroadcastMessageError('');
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

  const handleStartChat = () => {
    if (!selectedAstrologerId || !user) return;
    const messageToSend = directMessage.trim() || directQuestion.trim();
    if (!messageToSend) {
      setDirectMessageError(t('messageCannotBeEmpty'));
      return;
    }
    setDirectMessageError('');
    setShowDirectProfileModal(true);
  };

  const handleDirectProfileConfirm = async (profileId: string) => {
    setShowDirectProfileModal(false);
    if (!selectedAstrologerId || !user) return;

    const messageToSend = directMessage.trim() || directQuestion.trim();
    if (!messageToSend) {
      setDirectMessageError(t('messageCannotBeEmpty'));
      return;
    }
    setDirectMessageError('');

    // Persist selection for future broadcasts
    setBroadcastProfileId(profileId);

    if (profileId === 'me') {
      const profileCheck = checkClientProfileCompletion(user);
      if (!profileCheck.isComplete) {
        setMissingProfileFields(profileCheck.missingFields);
        setShowProfileIncompleteDialog(true);
        return;
      }
    }

    const birthDetails = getBirthDetailsForProfile(user, familyProfiles, profileId);
    const messageMetadata = {
      questionCategory: directCategory || undefined,
      ...(birthDetails && Object.keys(birthDetails).length > 0 && { birthDetails }),
    };
    await startChat(
      selectedAstrologerId,
      undefined,
      messageToSend,
      directCategory || undefined,
      Object.keys(messageMetadata).length > 0
        ? {
            questionCategory: messageMetadata.questionCategory,
            ...(messageMetadata.birthDetails
              ? { birthDetails: messageMetadata.birthDetails as Record<string, string> }
              : {}),
          }
        : undefined,
      profileId
    );
  };

  const hasBroadcastSelection =
    selectedBroadcastQuestionIds.length > 0 ||
    (broadcastMessage.trim() || broadcastQuestion.trim()).length > 0;

  const handleOpenBroadcastProfileModal = async () => {
    if (!user) return;
    if (selectedBroadcastQuestionIds.length === 0) {
      if (!(broadcastMessage.trim() || broadcastQuestion.trim())) {
        setBroadcastMessageError(t('messageCannotBeEmpty'));
        return;
      }
      if (!socket || !isConnected) {
        toast.error('Not connected. Please refresh the page.');
        return;
      }
    }
    setBroadcastMessageError('');
    try {
      const activeChat = await chatService.getActiveChat();
      if (activeChat) {
        toast.error(ACTIVE_CHAT_ERROR, {
          description: 'End your current chat before starting a new one.',
          duration: 5000,
        });
        return;
      }
    } catch {
      // Ignore; allow user to proceed
    }
    // We now use inline profile selection for broadcast.
    // Use the currently selected broadcast profile to start the flow.
    await handleBroadcastProfileConfirm(broadcastProfileId);
  };

  const handleBroadcastProfileConfirm = async (profileId: string) => {
    if (!user) return;

    if (profileId === 'me') {
      const profileCheck = checkClientProfileCompletion(user);
      if (!profileCheck.isComplete) {
        setMissingProfileFields(profileCheck.missingFields);
        setShowProfileIncompleteDialog(true);
        return;
      }
    }

    const birthDetails = getBirthDetailsForProfile(user, familyProfiles, profileId);

    if (selectedBroadcastQuestionIds.length > 0) {
      try {
        setIsSending(true);
        const result = await prepareMutation.mutateAsync(selectedBroadcastQuestionIds);
        const birthDetailsObj =
          birthDetails && Object.keys(birthDetails).length > 0
            ? (birthDetails as Record<string, string>)
            : undefined;
        setPendingBroadcastBirthDetails(birthDetailsObj);
        setPrepareResult({
          totalNr: result.totalNr,
          remainingNr: result.remainingNr,
          questions: result.questions,
        });
        if (result.remainingNr > 0) {
          setShowRemainingPayModal(true);
        } else {
          await sendQuestionsMutation.mutateAsync({
            questionItems: result.questions,
            totalNr: result.totalNr,
            birthDetails: birthDetailsObj,
          });
        }
      } catch {
        // prepareMutation already toasts onError
      } finally {
        setIsSending(false);
      }
      return;
    }

    const messageToSend = broadcastMessage.trim() || broadcastQuestion.trim();
    if (!messageToSend) {
      setBroadcastMessageError(t('messageCannotBeEmpty'));
      return;
    }
    if (!socket || !isConnected) {
      toast.error('Not connected. Please refresh the page.');
      return;
    }
    setBroadcastMessageError('');
    try {
      const activeChat = await chatService.getActiveChat();
      if (activeChat) {
        toast.error(ACTIVE_CHAT_ERROR, {
          description: 'End your current chat before starting a new one.',
          duration: 5000,
        });
        return;
      }
    } catch {
      // Ignore; allow user to proceed
    }

    try {
      setIsSending(true);
      socket.emit('broadcast:sendMessage', {
        content: messageToSend,
        type: 'TEXT',
        ...(birthDetails && Object.keys(birthDetails).length > 0 && { birthDetails }),
      });
      markSending();
    } catch (error) {
      console.error('Error sending broadcast message:', error);
      toast.error('Failed to send message');
      setIsSending(false);
    }
  };

  const finalBroadcastMessage = broadcastMessage.trim() || broadcastQuestion.trim();
  const selectedCount = selectedBroadcastQuestionIds.length;
  const totalNrPreview = getTotalNrForCount(selectedCount);
  const displayTotalNr = totalNrPreview;

  // For UI: show original (non-discounted) price vs discounted tier price when applicable.
  // Use the smallest tier as the base per-question rate; if a higher-count tier is cheaper,
  // we show the crossed-out original total (base * count) and the discounted tier total.
  const baseTier = pricingTiers.length
    ? pricingTiers.slice().sort((a, b) => a.questionCount - b.questionCount)[0]
    : null;
  const basePerQuestion = baseTier ? baseTier.amountNr / baseTier.questionCount : null;
  const originalTotalNr =
    basePerQuestion && selectedCount > 0
      ? Math.round(basePerQuestion * selectedCount)
      : null;
  const hasDiscount =
    originalTotalNr !== null &&
    displayTotalNr > 0 &&
    originalTotalNr > displayTotalNr;

  // If waiting for acceptance, show matching modal
  if (isWaitingForAcceptance && pendingMessage) {
    return (
      <>
        <JyotishMatchingModal
          isOpen={isWaitingForAcceptance && !!pendingMessage}
          onCancel={handleCancelRequest}
          timeRemaining={timeRemaining}
          title={t('searchingForJyotish')}
          subtitle={t('messageBroadcastedWaiting')}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 h-full transition-all duration-300">
        {/* Header */}
        <div className="animate-in fade-in slide-in-from-right-4 delay-100">
          <h3 className="text-xl font-bold text-white mb-2">{t('askYourQuestion')}</h3>
          <p className="text-sm text-gray-400">
            {t('chooseHowToContact')}
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
              {t('chatWithSpecificJyotish')}
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
                {t('all')}
              </span>
              {t('publishToAllJyotish')}
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
                  {t('selectJyotishToStart')}
                </p>
              </div>
            )}

            {selectedAstrologerId && (
              <>
                {/* Category, Question & Message (direct tab) */}
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 delay-200">
                  {/* Category Selection */}
                  <div className="w-full">
                    <label className="text-sm text-gray-300 mb-2 block">{t('selectCategory')}</label>
                    <Select
                      value={directCategory}
                      onValueChange={(value) =>
                        value === 'CLEAR'
                          ? handleDirectCategorySelect('')
                          : handleDirectCategorySelect(value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('selectCategoryPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CLEAR">
                          <span className="text-gray-400">{t('clearSelection')}</span>
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
                      <label className="text-sm text-gray-300 mb-2 block">{t('selectQuestion')}</label>
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
                          <SelectValue placeholder={t('selectQuestionPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] [&_[data-radix-select-scroll-up-button]]:hidden [&_[data-radix-select-scroll-down-button]]:hidden">
                          <SelectItem value="CLEAR_QUESTION">
                            <span className="text-gray-400">{t('clearQuestion')}</span>
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
                        ? t('editQuestionBeforeSending')
                        : t('typeQuestionForJyotish')}
                    </label>
                    <textarea
                      value={directMessage}
                      onChange={(e) => {
                        setDirectMessageError('');
                        handleDirectMessageChange(e.target.value);
                      }}
                      placeholder={
                        directQuestion ? directQuestion : t('typeQuestionHere')
                      }
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[80px] resize-none"
                    />
                    {directMessageError && (
                      <p className="text-xs text-red-400 mt-1">{directMessageError}</p>
                    )}
                  </div>
                </div>

                {/* Insufficient coins banner + Top up */}
                {showInsufficientCoinsBanner && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-sm text-amber-100">
                      {t('youNeedCoins', {
                        count: requiredCoinsDirect,
                        balance: coinBalance,
                      })}
                    </p>
                    <Button
                      onClick={() => {
                        setDirectRequiredCoins(requiredCoinsDirect);
                        setShowDirectCoinModal(true);
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {t('topUp')}
                    </Button>
                  </div>
                )}

                {/* Action Button */}
                <div className="flex gap-2 mt-auto">
                  <Button
                    onClick={handleStartChat}
                    disabled={!selectedAstrologerId || showInsufficientCoinsBanner}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 transition-all font-medium"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {t('startChat')}
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
                  {t('yourQuestionPublishedToAll')}
                </p>
              </div>
              <p className="text-xs text-orange-200/80">
                {t('firstToAcceptStartsChat')}
              </p>
            </div>

            {/* Select profile whose birth details will be shared */}
            <div className="mt-3 animate-in fade-in slide-in-from-bottom-2 delay-150">
              <SelectProfileSection
                user={user}
                profiles={familyProfiles}
                selectedProfileId={broadcastProfileId}
                onSelectProfileId={setBroadcastProfileId}
                compact
              />
            </div>

            {/* Category, Question & Message (broadcast tab) */}
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 delay-200">
              {/* Category Selection */}
              <div className="w-full">
                <label className="text-sm text-gray-300 mb-2 block">{t('selectCategory')}</label>
                <Select
                  value={broadcastCategory}
                  onValueChange={(value) =>
                    value === 'CLEAR'
                      ? handleBroadcastCategorySelect('')
                      : handleBroadcastCategorySelect(value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('selectCategoryPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLEAR">
                      <span className="text-gray-400">{t('clearSelection')}</span>
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

              {/* Multi-select questions (if category selected) */}
              {broadcastCategoryData && (
                <div className="w-full animate-in fade-in slide-in-from-bottom-4 delay-300 space-y-2">
                  <label className="text-sm text-gray-300 block">
                    {t('selectQuestion')} (select one or more)
                  </label>
                  <div className="rounded-lg border border-gray-600 bg-white/5 max-h-[200px] overflow-y-auto p-2 space-y-1.5">
                    {broadcastCategoryData.questions.map((question) => (
                      <label
                        key={question.id}
                        className="flex items-start gap-2 cursor-pointer rounded px-2 py-1.5 hover:bg-white/5 text-sm text-gray-200"
                      >
                        <input
                          type="checkbox"
                          checked={selectedBroadcastQuestionIds.includes(question.id)}
                          onChange={(e) =>
                            handleBroadcastQuestionToggle(question.id, e.target.checked)
                          }
                          className="mt-1 rounded border-gray-500 bg-slate-800 text-orange-500 focus:ring-orange-500"
                        />
                        <span className="flex-1">{question.text}</span>
                      </label>
                    ))}
                  </div>
                  {selectedCount > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-orange-200 flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-2">
                          <span>
                            {selectedCount} question{selectedCount === 1 ? '' : 's'}
                          </span>
                          {hasDiscount && originalTotalNr !== null && (
                            <span className="text-[11px] text-orange-200/80 line-through">
                              NRs {originalTotalNr.toLocaleString()}
                            </span>
                          )}
                          <span className="text-xs font-semibold text-amber-200">
                            NRs {displayTotalNr.toLocaleString()}
                          </span>
                        </span>
                        {selectedQuestionTexts.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowSelectedQuestionsModal(true)}
                            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-amber-200 hover:text-amber-50 hover:bg-amber-500/10 border border-amber-400/40 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View your questions</span>
                          </button>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Custom Message Input */}
              <div className="w-full animate-in fade-in slide-in-from-bottom-4 delay-400">
                <label className="text-sm text-gray-300 mb-2 block">
                  {broadcastQuestion
                    ? t('orEditBeforePublish')
                    : t('orTypeToAll')}
                </label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => {
                    setBroadcastMessageError('');
                    handleBroadcastMessageChange(e.target.value);
                  }}
                  placeholder={
                    broadcastQuestion
                      ? broadcastQuestion
                      : t('typeQuestionToPublishPlaceholder')
                  }
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[80px] resize-none"
                />
                {broadcastMessageError && (
                  <p className="text-xs text-red-400 mt-1">{broadcastMessageError}</p>
                )}
              </div>
            </div>

            {/* Broadcast Button - opens Select Profile modal, then sends on confirm */}
            <div className="flex gap-2 mt-auto">
              <LoadingButton
                onClick={handleOpenBroadcastProfileModal}
                disabled={!hasBroadcastSelection}
                loading={isSending || prepareMutation.isPending || sendQuestionsMutation.isPending}
                loadingText={t('sending')}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 transition-all font-medium"
              >
                <MessageSquare className="h-4 w-4" />
                {selectedCount > 0 ? (
                  hasDiscount && originalTotalNr !== null ? (
                    <>
                      {t('sendMessageToAll')}{' '}
                      {`(${selectedCount} · `}
                      <span className="line-through mr-1">
                        NRs {originalTotalNr.toLocaleString()}
                      </span>
                      <span className="font-semibold">
                        NRs {displayTotalNr.toLocaleString()}
                      </span>
                      {')'}
                    </>
                  ) : (
                    `${t('sendMessageToAll')} (${selectedCount} · NRs ${displayTotalNr.toLocaleString()})`
                  )
                ) : (
                  t('sendMessageToAll')
                )}
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

      {/* Selected broadcast questions modal */}
      <Dialog
        open={showSelectedQuestionsModal && selectedQuestionTexts.length > 0}
        onOpenChange={(open) => {
          if (!open) setShowSelectedQuestionsModal(false);
        }}
      >
        <DialogContent className="bg-slate-950 border border-amber-500/40 text-white max-w-md">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-amber-300" />
              <DialogTitle className="text-sm font-semibold text-white">
                Selected questions ({selectedQuestionTexts.length})
              </DialogTitle>
            </div>
            <button
              type="button"
              onClick={() => setShowSelectedQuestionsModal(false)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </DialogHeader>
          <div className="mt-2 max-h-64 overflow-y-auto space-y-1">
            <ul className="list-disc list-inside text-xs sm:text-sm text-slate-100 space-y-1">
              {selectedQuestionTexts.map((text: string, index: number) => (
                <li key={index}>{text}</li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      {/* Direct-chat coin purchase modal (for starting chat with specific Jyotish) */}
      <CoinPurchaseModalWrapper
        isOpen={showDirectCoinModal}
        onClose={() => setShowDirectCoinModal(false)}
        requiredCoins={directRequiredCoins}
        onPurchaseSuccess={retryChat}
      />

      {/* Select Profile modal - opens when user clicks Start Chat (direct) */}
      <SelectProfileModal
        isOpen={showDirectProfileModal}
        onClose={() => setShowDirectProfileModal(false)}
        onConfirm={handleDirectProfileConfirm}
        title={t('selectProfile')}
        confirmLabel={t('startChat')}
      />

      {/* Pay remaining NRs for multi-question broadcast */}
      {prepareResult && prepareResult.remainingNr > 0 && (
        <BroadcastRemainingPayModal
          isOpen={showRemainingPayModal}
          onClose={() => {
            setShowRemainingPayModal(false);
            setPrepareResult(null);
          }}
          remainingNr={prepareResult.remainingNr}
          questions={prepareResult.questions}
          payload={{
            questionItems: prepareResult.questions,
            totalNr: prepareResult.totalNr,
            birthDetails: pendingBroadcastBirthDetails,
          }}
        />
      )}
    </>
  );
}
