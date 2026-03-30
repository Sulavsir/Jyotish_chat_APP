/**
 * Ask Questions Section Component
 * Left section with category selection, predefined questions, and jyotish dropdown
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, MessageSquare } from 'lucide-react';
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
import { QUERY_KEYS } from '@/constants';
import { JyotishSelector } from './JyotishSelector';
import { useChat, CoinPurchaseModalWrapper } from '@/hooks/useChat';
import { useBroadcastPending } from '@/hooks/useBroadcastPending';
import { checkClientProfileCompletion } from '@/utils/profile-completion';
import { useAuthStore } from '@/store/auth-store';
import { ProfileIncompleteDialog } from '@/components/ui/ProfileIncompleteDialog';
import { CoinPurchaseModal, BroadcastPaymentDetailsModal } from '@/components/modals';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { QuestionnaireCategory } from '@jyotish/shared';
import { questionnaireService } from '@/services/questionnaire.service';
import broadcastMessageService from '@/services/broadcastMessage.service';
import { useQuestionnaireLanguageStore } from '@/store/questionnaire-language.store';
import { useSocket } from '@/hooks/useSocket';
import { toast } from 'sonner';
import { useAskQuestionsLayoutStore } from '@/store/ask-questions-layout.store';
import { useTranslations } from '@/hooks/useTranslations';
import chatService, { sendDirectQuestionBundle } from '@/services/chat.service';
import { ROUTE_BUILDERS } from '@/constants';
import { clientProfileService } from '@/services/clientProfile.service';
import { getBirthDetailsForProfile } from '@/utils/birth-details.utils';
import { refetchClientBalanceAndStats } from '@/utils/query.utils';
import { SelectProfileModal } from '@/components/modals';
import { SelectProfileSection } from '@/components/profile';
import { useCoinRates } from '@/hooks/useCoinRates';
import coinService from '@/services/coin.service';
import { AstrologerCategory } from '@/types/astrologer';
import { SelectedQuestionsModal, type SelectedQuestionDetailed } from './SelectedQuestionsModal';
import { CHAT_MESSAGE_MAX_LENGTH_CLIENT } from '@jyotish/shared';
import {
  computeBroadcastBaseTotalNr,
  computeBroadcastTotalNrWithQ1Discount,
} from '@/utils/broadcastQuestionPricing.utils';
import { useBroadcastPendingStore } from '@/store/broadcast-pending.store';
import type { BroadcastPriceBreakdownEntry } from '@/types/broadcast';

const ACTIVE_CHAT_ERROR =
  'You have an active chat. End your current chat before starting a new one.';

/** Order matches checklist selection order, then custom texts (same as broadcast prepare). */
function buildDirectBundleQuestionItems(
  orderedIds: string[],
  categories: QuestionnaireCategory[],
  customTexts: string[]
): { id: string; text: string; isCustom?: boolean }[] {
  const idToText = new Map<string, string>();
  for (const cat of categories) {
    for (const q of cat.questions) {
      idToText.set(q.id, q.text);
    }
  }
  const items: { id: string; text: string; isCustom?: boolean }[] = [];
  for (const id of orderedIds) {
    const text = idToText.get(id);
    if (text) items.push({ id, text });
  }
  customTexts.forEach((t, i) => {
    const trimmed = t.trim();
    if (trimmed) items.push({ id: `custom:${i}`, text: trimmed, isCustom: true });
  });
  return items;
}

export function AskQuestionsSection() {
  const { t } = useTranslations();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { socket, isConnected } = useSocket();
  const [mode, setMode] = useState<'direct' | 'broadcast'>('direct');
  const [selectedAstrologerId, setSelectedAstrologerId] = useState<string>('');
  const [selectedAstrologer, setSelectedAstrologer] = useState<{
    name: string;
    category: AstrologerCategory;
    chatMessageFee?: number | null;
  } | null>(null);
  const [selectedAstrologerCategory, setSelectedAstrologerCategory] =
    useState<AstrologerCategory | null>(null);
  const { setShowExtraInfoCards } = useAskQuestionsLayoutStore();

  // Direct-chat tab state
  const [directCategory, setDirectCategory] = useState<string>('');
  const [directMessage, setDirectMessage] = useState('');
  const [selectedDirectQuestionIds, setSelectedDirectQuestionIds] = useState<string[]>([]);
  const [showDirectProfileModal, setShowDirectProfileModal] = useState(false);

  // Broadcast tab state
  const [broadcastCategory, setBroadcastCategory] = useState<string>('');
  const [broadcastQuestion, setBroadcastQuestion] = useState<string>('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [selectedBroadcastQuestionIds, setSelectedBroadcastQuestionIds] = useState<string[]>([]);
  const [broadcastProfileId, setBroadcastProfileId] = useState<string>('me');
  const [showSelectedQuestionsModal, setShowSelectedQuestionsModal] = useState(false);
  const [showSelectedDirectQuestionsModal, setShowSelectedDirectQuestionsModal] = useState(false);
  const [prepareResult, setPrepareResult] = useState<{
    totalNr: number;
    originalTotalNr: number;
    discountPercentApplied: number;
    firstBroadcastDiscountPct: number;
    breakdown: import('@/types/broadcast').BroadcastPriceBreakdownEntry[];
    remainingNr: number;
    questions: { id: string; text: string; isCustom?: boolean }[];
    isTextOnly?: boolean;
    textMessage?: string;
  } | null>(null);
  const [pendingBroadcastBirthDetails, setPendingBroadcastBirthDetails] = useState<
    Record<string, string> | undefined
  >(undefined);
  const [showRemainingPayModal, setShowRemainingPayModal] = useState(false);
  /** After profile confirm, tiered direct-chat payment uses same modal as broadcast */
  const [paymentFlow, setPaymentFlow] = useState<'broadcast' | 'direct' | null>(null);
  const [directBundleAfterProfile, setDirectBundleAfterProfile] = useState<{
    astrologerId: string;
    profileId: string;
  } | null>(null);
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

  const { rates: coinRates } = useCoinRates(
    (mode === 'direct' && !!selectedAstrologerId) || mode === 'broadcast'
  );
  const { data: balanceData } = useQuery({
    queryKey: QUERY_KEYS.COINS.BALANCE,
    queryFn: () => coinService.getBalance(),
    // Balance is needed for both direct and broadcast flows to compute "remaining to pay"
    enabled: !!user,
  });
  const coinBalance = balanceData?.balance ?? 0;
  const [selectedAstrologerFee, setSelectedAstrologerFee] = useState<number | null>(null);
  const isAppointmentOnlyDirect =
    selectedAstrologerCategory === AstrologerCategory.PREMIUM ||
    selectedAstrologerCategory === AstrologerCategory.KATHA_VACHAK;
  const basePerMessageNr =
    selectedAstrologerFee && selectedAstrologerFee > 0
      ? selectedAstrologerFee
      : (coinRates?.CHAT_PER_MESSAGE ?? 0);
  const requiredCoinsDirect = isAppointmentOnlyDirect ? 0 : basePerMessageNr;

  const { isSending, setIsSending, isWaitingForAcceptance, markSending, clearWaiting } =
    useBroadcastPending({
      onInsufficientCoins: (coins) => {
        setBroadcastRequiredCoins(coins);
        setIsBroadcastCoinModalOpen(true);
      },
    });

  // Load question categories when user interacts with Ask Questions (direct or broadcast tab)
  const needsQuestionnaires = mode === 'direct' || mode === 'broadcast';
  const { data: questionnairesData } = useQuery({
    queryKey: [QUERY_KEYS.PUBLIC_QUESTIONNAIRES(questionnaireLanguage)],
    queryFn: () => questionnaireService.listPublic(questionnaireLanguage),
    staleTime: 5 * 60 * 1000,
    enabled: needsQuestionnaires,
  });

  const questionCategories: QuestionnaireCategory[] = React.useMemo(
    () => questionnairesData?.categories ?? [],
    [questionnairesData]
  );

  const { data: pricingData } = useQuery({
    queryKey: QUERY_KEYS.BROADCAST.QUESTION_PRICING,
    queryFn: () => broadcastMessageService.getQuestionPricing(),
    enabled: mode === 'broadcast' && !!user,
  });
  const pricingTiers = React.useMemo(() => pricingData?.tiers ?? [], [pricingData]);

  const refreshUser = useAuthStore((s) => s.refreshUser);

  // Sync from GET /users/me — hasFreeBroadcastAvailable is not in persisted auth until refreshed
  useEffect(() => {
    if (mode !== 'broadcast') return;
    void refreshUser();
  }, [mode, refreshUser]);

  // Whether this client still has their once-in-lifetime first-broadcast discount (server: hasUserUsedBroadcast)
  const hasFirstBroadcastDiscount = user?.hasFreeBroadcastAvailable === true;
  const firstBroadcastDiscountPct = coinRates?.FIRST_BROADCAST_DISCOUNT ?? 0;

  /**
   * Mirrors backend: compose bundle tiers with minimum total (e.g. 3Q → 2Q bundle + 1Q).
   */
  const getTotalNrForCount = (count: number, applyDiscount = false): number => {
    if (count <= 0) return 0;
    const broadcastSendRate = coinRates?.BROADCAST_SEND ?? 0;
    if (!broadcastSendRate && !pricingTiers.length) return 0;
    const clampedDiscount = applyDiscount
      ? Math.max(0, Math.min(100, firstBroadcastDiscountPct))
      : 0;

    if (applyDiscount && clampedDiscount > 0) {
      return computeBroadcastTotalNrWithQ1Discount(
        count,
        pricingTiers,
        broadcastSendRate,
        clampedDiscount
      );
    }
    return computeBroadcastBaseTotalNr(count, pricingTiers, broadcastSendRate);
  };

  const directBundleQuestionCount =
    selectedDirectQuestionIds.length + (directMessage.trim() ? 1 : 0);
  const directPerMessageNr =
    basePerMessageNr > 0 ? basePerMessageNr : (coinRates?.CHAT_PER_MESSAGE ?? 0);
  const estimatedDirectBundleNr =
    selectedDirectQuestionIds.length > 0 &&
    !isAppointmentOnlyDirect &&
    directBundleQuestionCount > 0
      ? directBundleQuestionCount * directPerMessageNr
      : null;
  const coinsNeededForDirect =
    !isAppointmentOnlyDirect &&
    selectedDirectQuestionIds.length > 0 &&
    estimatedDirectBundleNr != null
      ? estimatedDirectBundleNr
      : requiredCoinsDirect;
  const showInsufficientCoinsBanner =
    !!selectedAstrologerId && coinsNeededForDirect > 0 && coinBalance < coinsNeededForDirect;

  const prepareMutation = useMutation({
    mutationFn: (params: { questionIds: string[]; customTexts?: string[] }) =>
      broadcastMessageService.prepareQuestions(params),
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : 'Failed to prepare questions'),
  });
  const sendQuestionsMutation = useMutation({
    mutationFn: (payload: {
      questionItems: { id: string; text: string }[];
      totalNr: number;
      birthDetails?: Record<string, string>;
    }) => broadcastMessageService.sendQuestions(payload),
    onSuccess: async (_, variables) => {
      void refreshUser();
      void refetchClientBalanceAndStats(queryClient);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BROADCAST.MY_MESSAGES });
      setSelectedBroadcastQuestionIds([]);
      setBroadcastMessage('');
      setBroadcastQuestion('');
      setBroadcastCategory('');
      // Deduction toast + balance sync: BroadcastPendingBridge handles via `broadcast:questionsSent` socket;
      // if socket is unavailable, still restore pending UI from API.
      try {
        const msgs = await broadcastMessageService.getMyMessages();
        useBroadcastPendingStore.getState().hydrateFromMessages(msgs);
      } catch {
        /* ignore */
      }
      if (variables.totalNr > 0) {
        toast.info(`${variables.totalNr} NRs deducted from your balance`, { duration: 4000 });
      }
      toast.success(
        `${variables.questionItems.length} question${variables.questionItems.length === 1 ? '' : 's'} published to all Jyotish. Waiting for acceptance...`
      );
    },
    onError: (err) => {
      // Reset the waiting modal that was shown optimistically before this call
      clearWaiting();
      toast.error(err instanceof Error ? err.message : 'Failed to send questions');
    },
  });

  // Client profiles - defer until user needs to select (broadcast tab or direct + about to send)
  const needsProfiles = mode === 'broadcast' || (mode === 'direct' && !!selectedAstrologerId);
  const { data: profilesData } = useQuery({
    queryKey: QUERY_KEYS.USERS.PROFILES,
    queryFn: () => clientProfileService.list(),
    enabled: needsProfiles,
  });
  const familyProfiles = profilesData?.profiles ?? [];

  const directCategoryData = questionCategories.find((c) => c.id === directCategory);
  const broadcastCategoryData = questionCategories.find((c) => c.id === broadcastCategory);

  function buildSelectedQuestionsDetailed(
    ids: string[],
    categories: QuestionnaireCategory[]
  ): SelectedQuestionDetailed[] {
    if (!ids.length) return [];
    const result: SelectedQuestionDetailed[] = [];

    for (const category of categories) {
      for (const question of category.questions) {
        if (ids.includes(question.id)) {
          result.push({
            id: question.id,
            text: question.text,
            categoryName: category.name,
            emoji: category.emoji ?? undefined,
          });
        }
      }
    }

    return result;
  }

  const selectedBroadcastQuestionsDetailed = React.useMemo(
    () => buildSelectedQuestionsDetailed(selectedBroadcastQuestionIds, questionCategories),
    [questionCategories, selectedBroadcastQuestionIds]
  );
  const selectedDirectQuestionsDetailed = React.useMemo(
    () => buildSelectedQuestionsDetailed(selectedDirectQuestionIds, questionCategories),
    [questionCategories, selectedDirectQuestionIds]
  );

  /** Preview / validation: checklist questions + optional custom line (bundle: N × this Jyotish per-message fee). */
  const directOutgoingMessage = React.useMemo(() => {
    const trimmed = directMessage.trim();
    const fromChecklist = selectedDirectQuestionsDetailed.map((q) => q.text).join('\n\n');
    if (selectedDirectQuestionsDetailed.length === 0) return trimmed;
    if (!trimmed) return fromChecklist;
    return `${fromChecklist}\n\n${trimmed}`;
  }, [directMessage, selectedDirectQuestionsDetailed]);

  const handleAstrologerSelect = (
    astrologerId: string,
    astrologer?: { name: string; category: AstrologerCategory; chatMessageFee?: number | null }
  ) => {
    setSelectedAstrologerId(astrologerId);
    setSelectedAstrologer(
      astrologer
        ? {
            name: astrologer.name,
            category: astrologer.category,
            chatMessageFee: astrologer.chatMessageFee,
          }
        : null
    );
    setSelectedAstrologerCategory(astrologer?.category ?? null);
    setSelectedAstrologerFee(
      astrologer && astrologer.chatMessageFee && astrologer.chatMessageFee > 0
        ? astrologer.chatMessageFee
        : null
    );
    setDirectCategory('');
    setSelectedDirectQuestionIds([]);
    setDirectMessage('');
  };

  const handleAstrologerClear = () => {
    setSelectedAstrologerId('');
    setSelectedAstrologer(null);
    setSelectedAstrologerCategory(null);
    setSelectedAstrologerFee(null);
    setDirectCategory('');
    setSelectedDirectQuestionIds([]);
    setDirectMessage('');
  };

  // Direct tab handlers
  const handleDirectCategorySelect = (categoryId: string) => {
    setDirectCategory(categoryId);
    setDirectMessage('');
    setSelectedDirectQuestionIds([]);
  };

  const handleDirectQuestionToggle = (questionId: string, checked: boolean) => {
    setDirectMessageError('');
    setSelectedDirectQuestionIds((prev) =>
      checked ? [...prev, questionId] : prev.filter((id) => id !== questionId)
    );
  };

  const handleDirectMessageChange = (value: string) => {
    const max = selectedDirectQuestionIds.length > 0 ? 60 : CHAT_MESSAGE_MAX_LENGTH_CLIENT;
    setDirectMessage(value.slice(0, max));
  };

  // Broadcast tab handlers
  const handleBroadcastCategorySelect = (categoryId: string) => {
    setBroadcastCategory(categoryId);
    setBroadcastQuestion('');
    setBroadcastMessage('');
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
    const trimmed = directMessage.trim();
    const useTieredBundle = selectedDirectQuestionIds.length > 0 && !isAppointmentOnlyDirect;

    if (useTieredBundle) {
      if (trimmed.length > 60) {
        setDirectMessageError('Additional question cannot exceed 60 characters.');
        return;
      }
    } else {
      const joinedSelected =
        !trimmed && selectedDirectQuestionsDetailed.length > 0
          ? selectedDirectQuestionsDetailed.map((q) => q.text).join('\n\n')
          : '';
      const messageToSend = trimmed || joinedSelected;
      if (!messageToSend) {
        setDirectMessageError(t('messageCannotBeEmpty'));
        return;
      }
      if (messageToSend.length > CHAT_MESSAGE_MAX_LENGTH_CLIENT) {
        setDirectMessageError(`Message cannot exceed ${CHAT_MESSAGE_MAX_LENGTH_CLIENT} characters`);
        return;
      }
    }
    setDirectMessageError('');
    setShowDirectProfileModal(true);
  };

  const handleDirectProfileConfirm = async (profileId: string) => {
    setShowDirectProfileModal(false);
    if (!selectedAstrologerId || !user) return;

    const trimmed = directMessage.trim();
    const useTieredBundle = selectedDirectQuestionIds.length > 0 && !isAppointmentOnlyDirect;

    if (useTieredBundle) {
      if (trimmed.length > 60) {
        setDirectMessageError('Additional question cannot exceed 60 characters.');
        return;
      }
      setDirectMessageError('');

      if (profileId === 'me') {
        const profileCheck = checkClientProfileCompletion(user);
        if (!profileCheck.isComplete) {
          setMissingProfileFields(profileCheck.missingFields);
          setShowProfileIncompleteDialog(true);
          return;
        }
      }

      setBroadcastProfileId(profileId);
      setDirectBundleAfterProfile({ astrologerId: selectedAstrologerId, profileId });

      try {
        setIsSending(true);
        const customTexts = trimmed ? [trimmed.slice(0, 60)] : [];
        const questionItems = buildDirectBundleQuestionItems(
          selectedDirectQuestionIds,
          questionCategories,
          customTexts
        );
        const perMsg = directPerMessageNr;
        const totalNr = questionItems.length * perMsg;
        const breakdown: BroadcastPriceBreakdownEntry[] = questionItems.map((q, i) => ({
          position: i + 1,
          price: perMsg,
          isDiscounted: false,
          tierApplied: false,
          isCustom: q.isCustom,
        }));
        const remainingNr = Math.max(0, totalNr - coinBalance);

        const birthDetailsObj = getBirthDetailsForProfile(user, familyProfiles, profileId);
        const birthDetailsRecord =
          birthDetailsObj && Object.keys(birthDetailsObj).length > 0
            ? (birthDetailsObj as Record<string, string>)
            : undefined;
        setPendingBroadcastBirthDetails(birthDetailsRecord);
        setPrepareResult({
          totalNr,
          originalTotalNr: totalNr,
          discountPercentApplied: 0,
          firstBroadcastDiscountPct: 0,
          breakdown,
          remainingNr,
          questions: questionItems,
        });
        setPaymentFlow('direct');
        setShowRemainingPayModal(true);
      } catch {
        setDirectBundleAfterProfile(null);
      } finally {
        setIsSending(false);
      }
      return;
    }

    const joinedSelected =
      !trimmed && selectedDirectQuestionsDetailed.length > 0
        ? selectedDirectQuestionsDetailed.map((q) => q.text).join('\n\n')
        : '';
    const messageToSend = trimmed || joinedSelected;
    if (!messageToSend) {
      setDirectMessageError(t('messageCannotBeEmpty'));
      return;
    }
    if (messageToSend.length > CHAT_MESSAGE_MAX_LENGTH_CLIENT) {
      setDirectMessageError(`Message cannot exceed ${CHAT_MESSAGE_MAX_LENGTH_CLIENT} characters`);
      return;
    }
    setDirectMessageError('');

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

    // Guard: prevent sending when a broadcast is already pending
    if (isWaitingForAcceptance) {
      toast.error(
        'You already have a pending broadcast. Please wait for it to be accepted or expire before sending another one.'
      );
      return;
    }

    if (selectedBroadcastQuestionIds.length === 0) {
      if (!(broadcastMessage.trim() || broadcastQuestion.trim())) {
        setBroadcastMessageError(t('messageCannotBeEmpty'));
        return;
      }
      if (broadcastMessage.trim().length > 60) {
        setBroadcastMessageError('Question cannot exceed 60 characters.');
        return;
      }
      if (!socket || !isConnected) {
        toast.error('Not connected. Please refresh the page.');
        return;
      }
    }
    if (broadcastMessage.trim().length > 60) {
      setBroadcastMessageError('Question cannot exceed 60 characters.');
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
    // We now use inline profile selection for broadcast.
    // Use the currently selected broadcast profile to start the flow.
    await handleBroadcastProfileConfirm(broadcastProfileId);
  };

  const handleBroadcastProfileConfirm = async (profileId: string) => {
    if (!user) return;

    await refreshUser();
    const firstBroadcastStillAvailable =
      useAuthStore.getState().user?.hasFreeBroadcastAvailable === true;

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
        // Pass any typed text as a custom question alongside the predefined selections
        const customTexts = broadcastMessage.trim() ? [broadcastMessage.trim()] : [];
        const result = await prepareMutation.mutateAsync({
          questionIds: selectedBroadcastQuestionIds,
          customTexts,
        });
        const birthDetailsObj =
          birthDetails && Object.keys(birthDetails).length > 0
            ? (birthDetails as Record<string, string>)
            : undefined;
        setPendingBroadcastBirthDetails(birthDetailsObj);
        setPrepareResult({
          totalNr: result.totalNr,
          originalTotalNr: result.originalTotalNr,
          discountPercentApplied: result.discountPercentApplied,
          firstBroadcastDiscountPct: result.firstBroadcastDiscountPct,
          breakdown: result.breakdown,
          remainingNr: result.remainingNr,
          questions: result.questions,
        });
        // Always show "Your Payment Details" modal so user can review before publishing
        setPaymentFlow('broadcast');
        setShowRemainingPayModal(true);
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

    // For text-only broadcasts, show the unified "Your Payment Details" modal as well.
    // Pricing mirrors backend createBroadcastMessage: BROADCAST_SEND with first-broadcast discount once.
    const broadcastSendRate = coinRates?.BROADCAST_SEND ?? 0;
    const clampedDiscount = firstBroadcastStillAvailable
      ? Math.max(0, Math.min(100, firstBroadcastDiscountPct))
      : 0;
    const discountedCost =
      clampedDiscount > 0
        ? clampedDiscount >= 100
          ? 0
          : Math.round((broadcastSendRate * (100 - clampedDiscount)) / 100)
        : broadcastSendRate;
    const totalNr = discountedCost;
    const originalTotalNr = broadcastSendRate;
    const discountPercentApplied = clampedDiscount;

    const balance = coinBalance ?? 0;
    const coveredByBalance = Math.min(balance, totalNr);
    const remainingNr = Math.max(0, totalNr - coveredByBalance);

    const birthDetailsObj =
      birthDetails && Object.keys(birthDetails).length > 0
        ? (birthDetails as Record<string, string>)
        : undefined;
    setPendingBroadcastBirthDetails(birthDetailsObj);

    setPrepareResult({
      totalNr,
      originalTotalNr,
      discountPercentApplied,
      firstBroadcastDiscountPct: clampedDiscount,
      breakdown:
        broadcastSendRate > 0
          ? [
              {
                position: 1,
                price: discountedCost,
                isDiscounted: clampedDiscount > 0,
                tierApplied: false,
                isCustom: true,
              },
            ]
          : [],
      remainingNr,
      questions: [{ id: 'text', text: messageToSend, isCustom: true }],
      isTextOnly: true,
      textMessage: messageToSend,
    });
    setPaymentFlow('broadcast');
    setShowRemainingPayModal(true);
  };

  const finalBroadcastMessage = broadcastMessage.trim() || broadcastQuestion.trim();
  const selectedCount = selectedBroadcastQuestionIds.length;
  const hasCustomTextOnly = selectedCount === 0 && !!finalBroadcastMessage;
  const effectiveQuestionCount = hasCustomTextOnly ? 1 : selectedCount;

  // Discounted total (Q1 gets first-broadcast % off when available)
  const displayTotalNr = getTotalNrForCount(effectiveQuestionCount, hasFirstBroadcastDiscount);
  // Undiscounted total (for strikethrough)
  const originalTotalNr =
    effectiveQuestionCount > 0 ? getTotalNrForCount(effectiveQuestionCount, false) : null;
  // Show strikethrough only when the discount actually lowers the price
  const hasDiscount =
    hasFirstBroadcastDiscount &&
    firstBroadcastDiscountPct > 0 &&
    originalTotalNr !== null &&
    displayTotalNr < originalTotalNr;

  /**
   * Derived values for the Pricing Guide panel.
   * Shows: Q1 (with optional first-broadcast discount), each custom tier, and the standard rate.
   */

  return (
    <>
      <div className="flex flex-col gap-4 h-full transition-all duration-300">
        {/* Header */}
        <div className="animate-in fade-in slide-in-from-right-4 delay-100">
          <h3 className="text-xl font-bold text-white mb-2">{t('askYourQuestion')}</h3>
          <p className="text-sm text-gray-400">{t('chooseHowToContact')}</p>
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
                <p className="text-sm text-gray-300 text-center">{t('selectJyotishToStart')}</p>
              </div>
            )}

            {selectedAstrologerId && (
              <>
                {/* Category, Question & Message (direct tab) */}
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 delay-200">
                  {/* Category Selection */}
                  <div className="w-full">
                    <label className="text-sm text-gray-300 mb-2 block">
                      {t('selectCategory')}
                    </label>
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

                  {/* Question Selection (multi-select, like broadcast) */}
                  {directCategoryData && (
                    <div className="w-full animate-in fade-in slide-in-from-bottom-4 delay-300 space-y-2">
                      <label className="text-sm text-gray-300 block">
                        {t('selectQuestion')} (select one or more)
                      </label>
                      <div className="rounded-lg border border-gray-600 bg-white/5 max-h-[200px] overflow-y-auto p-2 space-y-1.5">
                        {directCategoryData.questions.map((question) => (
                          <label
                            key={question.id}
                            className="flex items-start gap-2 cursor-pointer rounded px-2 py-1.5 hover:bg-white/5 text-sm text-gray-200"
                          >
                            <input
                              type="checkbox"
                              checked={selectedDirectQuestionIds.includes(question.id)}
                              onChange={(e) =>
                                handleDirectQuestionToggle(question.id, e.target.checked)
                              }
                              className="mt-1 rounded border-gray-500 bg-slate-800 text-purple-500 focus:ring-purple-500"
                            />
                            <span className="flex-1">{question.text}</span>
                          </label>
                        ))}
                      </div>
                      {selectedDirectQuestionsDetailed.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-xs text-purple-200 flex items-center gap-2 flex-wrap">
                            <span>
                              {selectedDirectQuestionsDetailed.length} question
                              {selectedDirectQuestionsDetailed.length === 1 ? '' : 's'} selected
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowSelectedDirectQuestionsModal(true)}
                              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-purple-200 hover:text-purple-50 hover:bg-purple-500/10 border border-purple-400/40 transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>View your questions</span>
                            </button>
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Custom Message Input */}
                  <div className="w-full animate-in fade-in slide-in-from-bottom-4 delay-400">
                    <label className="text-sm text-gray-300 mb-2 block">
                      {selectedDirectQuestionsDetailed.length > 0
                        ? t('editQuestionBeforeSending')
                        : t('typeQuestionForJyotish')}
                    </label>
                    <textarea
                      value={directMessage}
                      maxLength={
                        selectedDirectQuestionIds.length > 0 ? 60 : CHAT_MESSAGE_MAX_LENGTH_CLIENT
                      }
                      onChange={(e) => {
                        setDirectMessageError('');
                        handleDirectMessageChange(e.target.value);
                      }}
                      placeholder={
                        selectedDirectQuestionsDetailed.length === 1
                          ? selectedDirectQuestionsDetailed[0].text
                          : t('typeQuestionHere')
                      }
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[80px] resize-none"
                    />
                    <p
                      className={`text-xs mt-0.5 text-right ${
                        (selectedDirectQuestionIds.length > 0
                          ? directMessage.length
                          : directOutgoingMessage.length) >=
                        (selectedDirectQuestionIds.length > 0 ? 60 : CHAT_MESSAGE_MAX_LENGTH_CLIENT)
                          ? 'text-amber-400'
                          : 'text-gray-500'
                      }`}
                    >
                      {selectedDirectQuestionIds.length > 0
                        ? directMessage.length
                        : directOutgoingMessage.length}
                      /{selectedDirectQuestionIds.length > 0 ? 60 : CHAT_MESSAGE_MAX_LENGTH_CLIENT}
                    </p>
                    {directMessageError && (
                      <p className="text-xs text-red-400 mt-1">{directMessageError}</p>
                    )}
                  </div>
                </div>

                {/* Insufficient balance banner + Top up */}
                {showInsufficientCoinsBanner && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-sm text-amber-100">
                      {t('youNeedCoins', {
                        count: coinsNeededForDirect,
                        balance: coinBalance,
                      })}
                    </p>
                    <Button
                      onClick={() => {
                        setDirectRequiredCoins(coinsNeededForDirect);
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
                    disabled={
                      !selectedAstrologerId ||
                      showInsufficientCoinsBanner ||
                      (selectedDirectQuestionIds.length > 0 && !isAppointmentOnlyDirect
                        ? directMessage.trim().length > 60
                        : directOutgoingMessage.trim().length === 0 ||
                          directOutgoingMessage.length > CHAT_MESSAGE_MAX_LENGTH_CLIENT)
                    }
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
              <p className="text-xs text-orange-200/80">{t('firstToAcceptStartsChat')}</p>
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
                    {broadcastCategoryData.questions.map((question) => {
                      const isSelected = selectedBroadcastQuestionIds.includes(question.id);
                      const selectedIndex = isSelected
                        ? selectedBroadcastQuestionIds.indexOf(question.id)
                        : -1;

                      const baseLabelClasses =
                        'flex items-start gap-2 cursor-pointer rounded px-2 py-1.5 text-sm transition-colors';

                      // Q1 with first-broadcast discount → amber/gold; all other selected → green
                      const paletteClasses = !isSelected
                        ? 'text-gray-200 hover:bg-white/5'
                        : selectedIndex === 0 && hasFirstBroadcastDiscount
                          ? 'text-amber-50 bg-amber-600/20 border border-amber-400/60'
                          : 'text-emerald-50 bg-emerald-600/20 border border-emerald-400/60';

                      return (
                        <label
                          key={question.id}
                          className={`${baseLabelClasses} ${paletteClasses}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) =>
                              handleBroadcastQuestionToggle(question.id, e.target.checked)
                            }
                            className="mt-1 rounded border-gray-500 bg-slate-800 text-orange-500 focus:ring-orange-500"
                          />
                          <span className="flex-1">{question.text}</span>
                        </label>
                      );
                    })}
                  </div>
                  {/* First-broadcast discount hint */}
                  {hasFirstBroadcastDiscount && firstBroadcastDiscountPct > 0 && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 border border-amber-400/30 text-[11px] text-amber-200">
                      🎁 Your first broadcast Q1 gets {firstBroadcastDiscountPct}% off
                    </div>
                  )}
                </div>
              )}

              {/* Custom Message Input — always visible; becomes "add a custom question" when predefined ones are selected */}
              <div className="w-full animate-in fade-in slide-in-from-bottom-4 delay-400">
                <label className="text-sm text-gray-300 mb-2 block">
                  {selectedBroadcastQuestionIds.length > 0
                    ? 'Also add your own question (optional)'
                    : broadcastQuestion
                      ? t('orEditBeforePublish')
                      : t('orTypeToAll')}
                </label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => {
                    setBroadcastMessageError('');
                    handleBroadcastMessageChange(e.target.value.slice(0, 60));
                  }}
                  placeholder={
                    broadcastQuestion ? broadcastQuestion : t('typeQuestionToPublishPlaceholder')
                  }
                  maxLength={60}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[80px] resize-none"
                />
                <p
                  className={`text-xs mt-0.5 text-right ${broadcastMessage.length >= 55 ? 'text-red-400' : 'text-gray-500'}`}
                >
                  {broadcastMessage.length}/60
                </p>
                {broadcastMessageError && (
                  <p className="text-xs text-red-400 mt-1">{broadcastMessageError}</p>
                )}
              </div>
            </div>

            {/* Broadcast Button - opens Select Profile modal, then sends on confirm */}
            <div className="flex gap-2 mt-auto">
              <LoadingButton
                onClick={handleOpenBroadcastProfileModal}
                disabled={!hasBroadcastSelection || isWaitingForAcceptance}
                loading={isSending || prepareMutation.isPending || sendQuestionsMutation.isPending}
                loadingText={t('sending')}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 transition-all font-medium"
              >
                <MessageSquare className="h-4 w-4" />
                {effectiveQuestionCount > 0 ? (
                  hasDiscount && originalTotalNr !== null ? (
                    <>
                      {t('sendMessageToAll')} {`(${effectiveQuestionCount} · `}
                      <span className="line-through mr-1">
                        NRs {originalTotalNr.toLocaleString()}
                      </span>
                      <span className="font-semibold">NRs {displayTotalNr.toLocaleString()}</span>
                      {')'}
                    </>
                  ) : (
                    `${t('sendMessageToAll')} (${effectiveQuestionCount} · NRs ${displayTotalNr.toLocaleString()})`
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

      {/* Balance / Top-up Modal (for broadcast tab insufficient balance) */}
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
      <SelectedQuestionsModal
        isOpen={showSelectedQuestionsModal && selectedBroadcastQuestionsDetailed.length > 0}
        onClose={() => setShowSelectedQuestionsModal(false)}
        questions={selectedBroadcastQuestionsDetailed}
      />

      {/* Selected direct-chat questions modal */}
      <SelectedQuestionsModal
        isOpen={showSelectedDirectQuestionsModal && selectedDirectQuestionsDetailed.length > 0}
        onClose={() => setShowSelectedDirectQuestionsModal(false)}
        questions={selectedDirectQuestionsDetailed}
      />

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
        feePerMessageNr={coinsNeededForDirect}
        astrologerName={selectedAstrologer?.name}
      />

      {/* Your Payment Details — always shown before publishing */}
      {prepareResult && (
        <BroadcastPaymentDetailsModal
          isOpen={showRemainingPayModal}
          onClose={() => {
            setShowRemainingPayModal(false);
            setPrepareResult(null);
            setPaymentFlow(null);
            setDirectBundleAfterProfile(null);
          }}
          remainingNr={prepareResult.remainingNr}
          questions={prepareResult.questions}
          payload={{
            questionItems: prepareResult.questions,
            totalNr: prepareResult.totalNr,
            originalTotalNr: prepareResult.originalTotalNr,
            discountPercentApplied: prepareResult.discountPercentApplied,
            firstBroadcastDiscountPct: prepareResult.firstBroadcastDiscountPct,
            breakdown: prepareResult.breakdown,
            birthDetails: pendingBroadcastBirthDetails,
          }}
          variant={paymentFlow === 'direct' ? 'direct' : 'broadcast'}
          directAstrologerName={selectedAstrologer?.name}
          directPendingPayload={
            paymentFlow === 'direct' && directBundleAfterProfile
              ? {
                  astrologerId: directBundleAfterProfile.astrologerId,
                  questionItems: prepareResult.questions,
                  totalNr: prepareResult.totalNr,
                  birthDetails: pendingBroadcastBirthDetails,
                  questionCategory: directCategory || undefined,
                  selectedProfileId: directBundleAfterProfile.profileId,
                }
              : undefined
          }
          onPublish={async () => {
            const current = prepareResult;
            const flow = paymentFlow;
            const directCtx = directBundleAfterProfile;
            const jyotishName = selectedAstrologer?.name;

            setShowRemainingPayModal(false);
            setPrepareResult(null);
            setPaymentFlow(null);
            setDirectBundleAfterProfile(null);

            if (!current) return;

            if (flow === 'direct' && directCtx) {
              try {
                setIsSending(true);
                const res = await sendDirectQuestionBundle({
                  astrologerId: directCtx.astrologerId,
                  questionItems: current.questions.map((q) => ({ id: q.id, text: q.text })),
                  totalNr: current.totalNr,
                  birthDetails: pendingBroadcastBirthDetails,
                  questionCategory: directCategory || undefined,
                });
                if (res.coinsDeducted > 0) {
                  toast.info(`${res.coinsDeducted} NRs deducted from your balance`, {
                    duration: 4000,
                  });
                }
                toast.success(
                  `${res.messageCount} question${res.messageCount === 1 ? '' : 's'} sent to ${jyotishName ?? 'your Jyotish'}.`
                );
                void refreshUser();
                void refetchClientBalanceAndStats(queryClient);
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHAT.CONVERSATIONS });
                const chatUrl = ROUTE_BUILDERS.CHAT_WITH_ID(res.chatId);
                const pid = directCtx.profileId;
                const urlWithProfile =
                  pid && pid !== 'me'
                    ? `${chatUrl}${chatUrl.includes('?') ? '&' : '?'}profileId=${encodeURIComponent(pid)}`
                    : chatUrl;
                router.push(urlWithProfile);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Failed to send questions');
              } finally {
                setIsSending(false);
              }
              return;
            }

            if (current.isTextOnly) {
              if (!socket || !isConnected) {
                toast.error('Not connected. Please refresh the page.');
                return;
              }
              try {
                setIsSending(true);
                markSending();
                socket.emit('broadcast:sendMessage', {
                  content: current.textMessage ?? '',
                  type: 'TEXT',
                  ...(pendingBroadcastBirthDetails &&
                    Object.keys(pendingBroadcastBirthDetails).length > 0 && {
                      birthDetails: pendingBroadcastBirthDetails,
                    }),
                });
              } catch (error) {
                console.error('Error sending broadcast message:', error);
                toast.error('Failed to send message');
                clearWaiting();
              }
            } else {
              markSending();
              sendQuestionsMutation.mutate({
                questionItems: current.questions,
                totalNr: current.totalNr,
                birthDetails: pendingBroadcastBirthDetails,
              });
            }
          }}
          isPublishing={sendQuestionsMutation.isPending || isSending}
        />
      )}
    </>
  );
}
