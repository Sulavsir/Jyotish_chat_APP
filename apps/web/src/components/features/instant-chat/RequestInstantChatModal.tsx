/**
 * Request Instant Chat Modal
 * Step 1: Select profile (Me / Family / Add).
 * Step 2: Category + multi-select questions (same as Publish to All flow) OR free text.
 * Step 3: "Your Payment Details" modal — always shown before publishing.
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Label,
  LoadingButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@jyotish/ui';
import { X, ArrowLeft } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSocket } from '@/hooks/useSocket';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';
import { useQuestionnaireLanguageStore } from '@/store/questionnaire-language.store';
import { checkClientProfileCompletion } from '@/utils/profile-completion';
import { getBirthDetailsForProfile } from '@/utils/birth-details.utils';
import { useCoinRates } from '@/hooks/useCoinRates';
import { QUERY_KEYS } from '@/constants';
import { questionnaireService } from '@/services/questionnaire.service';
import chatService from '@/services/chat.service';
import { clientProfileService } from '@/services/clientProfile.service';
import broadcastMessageService from '@/services/broadcastMessage.service';
import { SelectProfileSection } from '@/components/profile';
import { AddFamilyMemberModal, BroadcastPaymentDetailsModal } from '@/components/modals';
import type { QuestionnaireCategory, ClientProfile } from '@jyotish/shared';
import type {
  BroadcastPriceBreakdownEntry,
  SendBroadcastQuestionsRequest,
} from '@/types/broadcast';

const STEP_PROFILE = 1;
const STEP_MESSAGE = 2;

interface PaymentInfo {
  questions: { id: string; text: string }[];
  message?: string;
  totalNr: number;
  remainingNr: number;
  originalTotalNr: number;
  discountPercentApplied: number;
  firstBroadcastDiscountPct: number;
  breakdown: BroadcastPriceBreakdownEntry[];
  birthDetails?: Record<string, string>;
  isTextOnly: boolean;
}

export interface RequestInstantChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendSuccess?: () => void;
  onSendRequested?: () => void;
  isSending: boolean;
  setIsSending: (v: boolean) => void;
  coinCost?: number;
  /** Called when multi-question send fails so the parent can reset waiting state */
  clearWaiting?: () => void;
}

export function RequestInstantChatModal({
  isOpen,
  onClose,
  onSendRequested,
  isSending,
  setIsSending,
  coinCost,
  clearWaiting,
}: RequestInstantChatModalProps) {
  const user = useAuthStore((s) => s.user);
  const { socket, isConnected } = useSocket();
  const questionnaireLanguage = useQuestionnaireLanguageStore((s) => s.language);

  const [step, setStep] = useState(STEP_PROFILE);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('me');
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [messageText, setMessageText] = useState('');
  const [messageError, setMessageError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);

  const { rates: coinRates } = useCoinRates(isOpen && step === STEP_MESSAGE);

  const { data: profilesData } = useQuery({
    queryKey: QUERY_KEYS.USERS.PROFILES,
    queryFn: () => clientProfileService.list(),
    enabled: isOpen,
  });
  const familyProfiles: ClientProfile[] = React.useMemo(
    () => profilesData?.profiles ?? [],
    [profilesData]
  );

  const { data: questionnairesData } = useQuery({
    queryKey: QUERY_KEYS.PUBLIC_QUESTIONNAIRES(questionnaireLanguage),
    queryFn: () => questionnaireService.listPublic(questionnaireLanguage),
    enabled: isOpen && step === STEP_MESSAGE,
  });
  const questionCategories: QuestionnaireCategory[] = questionnairesData?.categories ?? [];
  const selectedCategoryData = questionCategories.find((c) => c.id === categoryId);

  const prepareMutation = useMutation({
    mutationFn: (params: { questionIds: string[]; customTexts?: string[] }) =>
      broadcastMessageService.prepareQuestions(params),
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to prepare questions. Please try again.');
    },
  });

  const sendQuestionsMutation = useMutation({
    mutationFn: (payload: SendBroadcastQuestionsRequest) =>
      broadcastMessageService.sendQuestions(payload),
    onError: (error: Error) => {
      clearWaiting?.();
      toast.error(error.message || 'Failed to send questions. Please try again.');
    },
  });

  useEffect(() => {
    if (!isOpen) {
      setStep(STEP_PROFILE);
      setSelectedProfileId('me');
      setCategoryId('');
      setSelectedQuestionIds([]);
      setMessageText('');
      setMessageError('');
      setShowPaymentModal(false);
      setPaymentInfo(null);
    }
  }, [isOpen]);

  const birthDetailsObj = React.useMemo(() => {
    const bd = getBirthDetailsForProfile(user, familyProfiles, selectedProfileId);
    return bd && Object.keys(bd).length > 0 ? (bd as Record<string, string>) : undefined;
  }, [user, familyProfiles, selectedProfileId]);

  const hasQuestionsSelected = selectedQuestionIds.length > 0;
  const hasTextMessage = messageText.trim().length > 0;
  const canReview = hasQuestionsSelected || hasTextMessage;

  const handleContinue = () => {
    if (selectedProfileId === 'me') {
      const profileCheck = checkClientProfileCompletion(user);
      if (!profileCheck.isComplete) {
        toast.error(
          'Please complete your profile (Name, Date/Time/Place of Birth, Gender) before continuing.'
        );
        return;
      }
    }
    setStep(STEP_MESSAGE);
  };

  const handleToggleQuestion = (questionId: string, checked: boolean) => {
    setSelectedQuestionIds((prev) =>
      checked ? [...prev, questionId] : prev.filter((id) => id !== questionId)
    );
    if (checked) setMessageError('');
  };

  const handleReviewAndSend = async () => {
    if (!canReview) {
      setMessageError('Please select a question or type your message.');
      return;
    }
    if (messageText.trim().length > 60) {
      setMessageError('Question cannot exceed 60 characters.');
      return;
    }

    try {
      const activeChat = await chatService.getActiveChat();
      if (activeChat) {
        toast.error('You have an active chat. End your current chat before starting a new one.', {
          duration: 5000,
        });
        return;
      }
    } catch {
      // Ignore; allow user to proceed
    }

    if (selectedProfileId === 'me') {
      const profileCheck = checkClientProfileCompletion(user);
      if (!profileCheck.isComplete) {
        toast.error('Please complete your profile before sending.');
        return;
      }
    }

    if (hasQuestionsSelected) {
      // Multi-question (+ optional typed custom): call prepare API for exact pricing & breakdown
      try {
        setIsSending(true);
        // Include any free-typed text as an additional custom question
        const customTexts = messageText.trim() ? [messageText.trim()] : [];
        const result = await prepareMutation.mutateAsync({
          questionIds: selectedQuestionIds,
          customTexts,
        });
        setPaymentInfo({
          questions: result.questions,
          totalNr: result.totalNr,
          remainingNr: result.remainingNr,
          originalTotalNr: result.originalTotalNr ?? result.totalNr,
          discountPercentApplied: result.discountPercentApplied ?? 0,
          firstBroadcastDiscountPct: result.firstBroadcastDiscountPct ?? 0,
          breakdown: result.breakdown ?? [],
          birthDetails: birthDetailsObj,
          isTextOnly: false,
        });
        setShowPaymentModal(true);
      } catch {
        // prepareMutation.onError handles the toast
      } finally {
        setIsSending(false);
      }
    } else {
      // Text-only: cost is BROADCAST_SEND rate; parent already verified sufficient balance
      const broadcastSendRate = coinRates?.BROADCAST_SEND ?? coinCost ?? 0;
      setPaymentInfo({
        questions: [],
        message: messageText.trim(),
        totalNr: broadcastSendRate,
        remainingNr: 0,
        originalTotalNr: broadcastSendRate,
        discountPercentApplied: 0,
        firstBroadcastDiscountPct: 0,
        breakdown:
          broadcastSendRate > 0
            ? [{ position: 1, price: broadcastSendRate, isDiscounted: false, tierApplied: false }]
            : [],
        birthDetails: birthDetailsObj,
        isTextOnly: true,
      });
      setShowPaymentModal(true);
    }
  };

  const handlePublish = () => {
    if (!paymentInfo) return;
    setShowPaymentModal(false);

    if (paymentInfo.isTextOnly) {
      if (!socket || !isConnected) {
        toast.error('Connection not ready. Please wait and try again.');
        return;
      }
      setIsSending(true);
      socket.emit('broadcast:sendMessage', {
        content: paymentInfo.message ?? '',
        type: 'TEXT',
        ...(paymentInfo.birthDetails &&
          Object.keys(paymentInfo.birthDetails).length > 0 && {
            birthDetails: paymentInfo.birthDetails,
          }),
      });
      onSendRequested?.();
      onClose();
    } else {
      // Close modal immediately, show waiting modal, fire API in background
      onSendRequested?.();
      onClose();
      sendQuestionsMutation.mutate({
        questionItems: paymentInfo.questions,
        totalNr: paymentInfo.totalNr,
        birthDetails: paymentInfo.birthDetails,
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md border border-white/10 bg-slate-900/95 backdrop-blur-md text-white shadow-xl shadow-black/20 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-semibold flex items-center justify-between text-white">
              <span>Request Instant Chat</span>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-gray-400 mb-2">
            Your request will be sent to all online astrologers. The first to accept will chat with
            you.
          </p>

          {step === STEP_PROFILE && (
            <>
              <SelectProfileSection
                user={user}
                profiles={familyProfiles}
                selectedProfileId={selectedProfileId}
                onSelectProfileId={setSelectedProfileId}
                onAddFamilyClick={() => setShowAddFamilyModal(true)}
                className="mb-3"
                compact
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-white/20 text-gray-300 hover:bg-white/10"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  onClick={handleContinue}
                >
                  Continue
                </Button>
              </div>
            </>
          )}

          {step === STEP_MESSAGE && (
            <>
              <div className="space-y-3 mb-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white -ml-1"
                  onClick={() => setStep(STEP_PROFILE)}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Change profile
                </Button>

                {/* Category */}
                <div>
                  <Label className="text-sm text-gray-300 block mb-1">Category</Label>
                  <Select
                    value={categoryId}
                    onValueChange={(v) => {
                      setCategoryId(v);
                      setSelectedQuestionIds([]);
                    }}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
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

                {/* Multi-select question list */}
                {selectedCategoryData && selectedCategoryData.questions.length > 0 && (
                  <div>
                    <Label className="text-sm text-gray-300 block mb-1">
                      Select question(s) (one or more)
                    </Label>
                    <div className="rounded-lg border border-gray-600 bg-white/5 max-h-[180px] overflow-y-auto p-2 space-y-1.5">
                      {selectedCategoryData.questions.map((question) => {
                        const isSelected = selectedQuestionIds.includes(question.id);
                        return (
                          <label
                            key={question.id}
                            className={`flex items-start gap-2 cursor-pointer rounded px-2 py-1.5 text-sm transition-colors ${
                              isSelected
                                ? 'text-emerald-50 bg-emerald-600/20 border border-emerald-400/60'
                                : 'text-gray-200 hover:bg-white/5'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleToggleQuestion(question.id, e.target.checked)}
                              className="mt-1 rounded border-gray-500 bg-slate-800 text-purple-500 focus:ring-purple-500"
                            />
                            <span className="flex-1">{question.text}</span>
                          </label>
                        );
                      })}
                    </div>
                    {selectedQuestionIds.length > 0 && (
                      <p className="text-xs text-emerald-300 mt-1">
                        {selectedQuestionIds.length} question
                        {selectedQuestionIds.length !== 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>
                )}

                {/* Free-text message — always visible; becomes additive when questions are selected */}
                <div>
                  <Label className="text-sm text-gray-300 block mb-1">
                    {hasQuestionsSelected
                      ? 'Also add your own question (optional)'
                      : selectedCategoryData
                        ? 'Or type your own question'
                        : 'Type your question'}
                  </Label>
                  <Textarea
                    value={messageText}
                    onChange={(e) => {
                      setMessageError('');
                      setMessageText(e.target.value.slice(0, 60));
                    }}
                    placeholder={
                      hasQuestionsSelected
                        ? 'Type an additional custom question...'
                        : 'Type your question...'
                    }
                    rows={3}
                    maxLength={60}
                    className="min-h-[80px] resize-none"
                  />
                  {messageError && <p className="text-xs text-red-400 mt-1">{messageError}</p>}
                  <p
                    className={`text-xs mt-0.5 text-right ${messageText.length >= 55 ? 'text-red-400' : 'text-gray-500'}`}
                  >
                    {messageText.length}/60
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-white/20 text-gray-300 hover:bg-white/10"
                  onClick={() => setStep(STEP_PROFILE)}
                  disabled={isSending || prepareMutation.isPending}
                >
                  Back
                </Button>
                <LoadingButton
                  onClick={handleReviewAndSend}
                  loading={isSending || prepareMutation.isPending}
                  disabled={isSending || prepareMutation.isPending || !canReview}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  Review & Send
                </LoadingButton>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Details Modal — rendered as sibling so it overlays the base dialog */}
      {paymentInfo && (
        <BroadcastPaymentDetailsModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          remainingNr={paymentInfo.remainingNr}
          questions={paymentInfo.questions}
          payload={{
            questionItems: paymentInfo.questions,
            totalNr: paymentInfo.totalNr,
            originalTotalNr: paymentInfo.originalTotalNr,
            discountPercentApplied: paymentInfo.discountPercentApplied,
            firstBroadcastDiscountPct: paymentInfo.firstBroadcastDiscountPct,
            breakdown: paymentInfo.breakdown,
            birthDetails: paymentInfo.birthDetails,
          }}
          onPublish={handlePublish}
          isPublishing={sendQuestionsMutation.isPending}
        />
      )}

      <AddFamilyMemberModal
        isOpen={showAddFamilyModal}
        onClose={() => setShowAddFamilyModal(false)}
        onSuccess={(profile) => setSelectedProfileId(profile.id)}
      />
    </>
  );
}
