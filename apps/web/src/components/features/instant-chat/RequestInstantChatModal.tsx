/**
 * Request Instant Chat Modal
 * Step 1: Select profile (Me / Family / Add). Step 2: Category, question, message, send.
 * Uses SelectProfileSection and getBirthDetailsForProfile.
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
import { X, Coins, AlertCircle, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useSocket } from '@/hooks/useSocket';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';
import { useQuestionnaireLanguageStore } from '@/store/questionnaire-language.store';
import { checkClientProfileCompletion } from '@/utils/profile-completion';
import { getBirthDetailsForProfile } from '@/utils/birth-details.utils';
import { QUERY_KEYS } from '@/constants';
import { questionnaireService } from '@/services/questionnaire.service';
import chatService from '@/services/chat.service';
import { clientProfileService } from '@/services/clientProfile.service';
import { SelectProfileSection } from '@/components/profile';
import { AddFamilyMemberModal } from '@/components/modals';
import type { QuestionnaireCategory, ClientProfile } from '@jyotish/shared';

const STEP_PROFILE = 1;
const STEP_MESSAGE = 2;

interface RequestInstantChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendSuccess?: () => void;
  onSendRequested?: () => void;
  isSending: boolean;
  setIsSending: (v: boolean) => void;
  coinCost?: number;
}

export function RequestInstantChatModal({
  isOpen,
  onClose,
  onSendSuccess,
  onSendRequested,
  isSending,
  setIsSending,
  coinCost,
}: RequestInstantChatModalProps) {
  const user = useAuthStore((s) => s.user);
  const { socket, isConnected } = useSocket();
  const questionnaireLanguage = useQuestionnaireLanguageStore((s) => s.language);

  const [step, setStep] = useState(STEP_PROFILE);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('me');
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messageError, setMessageError] = useState('');

  const { data: profilesData } = useQuery({
    queryKey: QUERY_KEYS.USERS.PROFILES,
    queryFn: () => clientProfileService.list(),
    enabled: isOpen,
  });
  const familyProfiles: ClientProfile[] = profilesData?.profiles ?? [];

  const { data: questionnairesData } = useQuery({
    queryKey: QUERY_KEYS.PUBLIC_QUESTIONNAIRES(questionnaireLanguage),
    queryFn: () => questionnaireService.listPublic(questionnaireLanguage),
    enabled: isOpen && step === STEP_MESSAGE,
  });
  const questionCategories: QuestionnaireCategory[] = questionnairesData?.categories ?? [];
  const selectedCategoryData = questionCategories.find((c) => c.id === categoryId);

  useEffect(() => {
    if (!isOpen) {
      setStep(STEP_PROFILE);
      setSelectedProfileId('me');
      setCategoryId('');
      setQuestionText('');
      setMessageText('');
      setMessageError('');
    }
  }, [isOpen]);

  const finalMessage = messageText.trim() || questionText.trim();
  const birthDetails = getBirthDetailsForProfile(user, familyProfiles, selectedProfileId);

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

  const handleSend = async () => {
    if (!socket || !isConnected) {
      toast.error('Connection not ready. Please wait and try again.');
      return;
    }
    if (!finalMessage) {
      setMessageError('Message cannot be empty');
      return;
    }
    setMessageError('');
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
    if (selectedProfileId === 'me') {
      const profileCheck = checkClientProfileCompletion(user);
      if (!profileCheck.isComplete) {
        toast.error(
          'Please complete your profile (Name, Date/Time/Place of Birth, Gender) before sending.'
        );
        return;
      }
    }
    setIsSending(true);
    socket.emit('broadcast:sendMessage', {
      content: finalMessage,
      type: 'TEXT',
      ...(birthDetails && Object.keys(birthDetails).length > 0 && { birthDetails }),
    });
    toast.success('Message request sent to all online Jyotish.', {
      description: 'Waiting for an astrologer to accept...',
      duration: 4000,
    });
    // Show matching modal with animation immediately (same as Publish to all Jyotish)
    onSendRequested?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md border border-white/10 bg-slate-900/95 backdrop-blur-md text-white shadow-xl shadow-black/20">
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

        <div className="mb-2 p-2 rounded-lg border border-purple-500/30 bg-purple-500/10 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-purple-200 mb-0.5">Coin cost</p>
            <p className="text-xs text-purple-200/90">
              Sending costs{' '}
              <span className="font-semibold inline-flex items-center gap-1 text-yellow-400">
                <Coins className="h-3 w-3 " />
                {coinCost != null ? `${coinCost} coin${coinCost === 1 ? '' : 's'}` : '…'}
              </span>
              . Deducted when you send.
            </p>
          </div>
        </div>

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
            <div className="space-y-2 mb-3">
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

              <Label className="text-sm text-gray-300 block">Category</Label>
              <Select
                value={categoryId}
                onValueChange={(v) => {
                  setCategoryId(v);
                  setQuestionText('');
                  setMessageText('');
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

              {selectedCategoryData && (
                <>
                  <Label className="text-sm text-gray-300 block">
                    Select question or type your own
                  </Label>
                  <Select
                    value={questionText}
                    onValueChange={(v) => {
                      setQuestionText(v);
                      setMessageText(v);
                    }}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select a question" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCategoryData.questions.map((q) => (
                        <SelectItem key={q.id} value={q.text}>
                          {q.text}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}

              <Label className="text-sm text-gray-300 block">
                Type your question to publish to all Jyotish
              </Label>
              <Textarea
                value={messageText}
                onChange={(e) => {
                  setMessageError('');
                  setMessageText(e.target.value);
                }}
                placeholder="Type your question..."
                rows={3}
                maxLength={500}
                className="min-h-[80px] resize-none"
              />
              {messageError && <p className="text-xs text-red-400 mt-1">{messageError}</p>}
              <p className="text-xs text-gray-500">{messageText.length}/500</p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-gray-300 hover:bg-white/10"
                onClick={() => setStep(STEP_PROFILE)}
                disabled={isSending}
              >
                Back
              </Button>
              <LoadingButton
                onClick={handleSend}
                loading={isSending}
                disabled={isSending || !finalMessage}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                Send Request
              </LoadingButton>
            </div>
          </>
        )}
      </DialogContent>

      <AddFamilyMemberModal
        isOpen={showAddFamilyModal}
        onClose={() => setShowAddFamilyModal(false)}
        onSuccess={(profile) => setSelectedProfileId(profile.id)}
      />
    </Dialog>
  );
}
