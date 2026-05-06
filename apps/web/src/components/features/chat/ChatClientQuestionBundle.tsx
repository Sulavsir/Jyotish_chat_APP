'use client';

/**
 * In 1:1 chat: select multiple questionnaire questions (+ optional custom line) and send via send-direct-question-bundle.
 */

import React, { useMemo, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  LoadingButton,
} from '@jyotish/ui';
import { ChevronDown, ChevronUp, Coins, ListChecks } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ClientProfile, QuestionnaireCategory, User } from '@jyotish/shared';
import { AstrologerCategory } from '@/types/astrologer';
import { QUERY_KEYS } from '@/constants';
import { questionnaireService } from '@/services/questionnaire.service';
import { useQuestionnaireLanguageStore } from '@/store/questionnaire-language.store';
import { useCoinRates } from '@/hooks/useCoinRates';
import coinService from '@/services/coin.service';
import astrologerService from '@/services/astrologer.service';
import { sendDirectQuestionBundle } from '@/services/chat.service';
import { buildDirectBundleQuestionItems } from '@/utils/directQuestionBundle.utils';
import { checkClientProfileCompletion } from '@/utils/profile-completion';
import { getBirthDetailsForProfile } from '@/utils/birth-details.utils';
import { toast } from 'sonner';
import { refetchClientBalanceAndStats } from '@/utils/query.utils';

export interface ChatClientQuestionBundleProps {
  astrologerId: string;
  /** Server-classified broadcast-origin chat → BROADCAST_PER_MESSAGE for bundle */
  isBroadcastOriginatedChat: boolean;
  disabled: boolean;
  selectedProfileId: string;
  familyProfiles: ClientProfile[];
  user: User | null;
  onSuccess: (result: { chatId: string; messageCount: number; coinsDeducted: number }) => void;
  onInsufficientCoins: (requiredNr: number) => void;
  onProfileIncomplete?: (missingFields: string[]) => void;
}

export function ChatClientQuestionBundle({
  astrologerId,
  isBroadcastOriginatedChat,
  disabled,
  selectedProfileId,
  familyProfiles,
  user,
  onSuccess,
  onInsufficientCoins,
  onProfileIncomplete,
}: ChatClientQuestionBundleProps) {
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [customLine, setCustomLine] = useState('');
  const questionnaireLanguage = useQuestionnaireLanguageStore((s) => s.language);
  const queryClient = useQueryClient();

  const { data: astrologerRes } = useQuery({
    queryKey: ['publicAstrologer', astrologerId],
    queryFn: () => astrologerService.getPublicProfile(astrologerId),
    enabled: !!astrologerId,
    staleTime: 60_000,
  });
  const astrologer = astrologerRes?.astrologer;
  const category = astrologer?.category as AstrologerCategory | undefined;

  const hideBundle =
    category === AstrologerCategory.PREMIUM || category === AstrologerCategory.KATHA_VACHAK;

  const { rates: coinRates } = useCoinRates(!hideBundle && !!astrologerId);
  const { data: balanceData } = useQuery({
    queryKey: QUERY_KEYS.COINS.BALANCE,
    queryFn: () => coinService.getBalance(),
    enabled: !!user,
  });
  const coinBalance = balanceData?.balance ?? 0;

  const { data: questionnairesData } = useQuery({
    queryKey: [QUERY_KEYS.PUBLIC_QUESTIONNAIRES(questionnaireLanguage)],
    queryFn: () => questionnaireService.listPublic(questionnaireLanguage),
    staleTime: 5 * 60 * 1000,
    enabled: open && !hideBundle,
  });

  const questionCategories: QuestionnaireCategory[] = useMemo(
    () => questionnairesData?.categories ?? [],
    [questionnairesData]
  );

  const categoryData = questionCategories.find((c) => c.id === categoryId);

  const perMessageNr = useMemo(() => {
    if (hideBundle) return 0;
    if (isBroadcastOriginatedChat) {
      return coinRates?.BROADCAST_PER_MESSAGE ?? 0;
    }
    const fee = astrologer?.chatMessageFee;
    if (fee != null && fee > 0) return fee;
    return coinRates?.CHAT_PER_MESSAGE ?? 0;
  }, [
    hideBundle,
    isBroadcastOriginatedChat,
    astrologer?.chatMessageFee,
    coinRates?.BROADCAST_PER_MESSAGE,
    coinRates?.CHAT_PER_MESSAGE,
  ]);

  const questionItems = useMemo(() => {
    const customTexts = customLine.trim() ? [customLine.trim().slice(0, 60)] : [];
    return buildDirectBundleQuestionItems(selectedQuestionIds, questionCategories, customTexts);
  }, [selectedQuestionIds, questionCategories, customLine]);

  const totalNr = questionItems.length * perMessageNr;

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!user || !astrologerId || questionItems.length === 0) {
        throw new Error('Select at least one question or add a custom line.');
      }
      if (selectedProfileId === 'me') {
        const check = checkClientProfileCompletion(user);
        if (!check.isComplete) {
          onProfileIncomplete?.(check.missingFields);
          throw new Error('PROFILE_INCOMPLETE');
        }
      }
      const birthDetails = getBirthDetailsForProfile(user, familyProfiles, selectedProfileId);
      const birthRecord =
        birthDetails && Object.keys(birthDetails).length > 0
          ? (birthDetails as Record<string, string>)
          : undefined;

      if (totalNr > 0 && coinBalance < totalNr) {
        onInsufficientCoins(totalNr);
        throw new Error('INSUFFICIENT_COINS');
      }

      return sendDirectQuestionBundle({
        astrologerId,
        questionItems: questionItems.map((q) => ({ id: q.id, text: q.text })),
        totalNr,
        birthDetails: birthRecord,
        questionCategory: categoryId || undefined,
      });
    },
    onSuccess: async (res) => {
      if (res.coinsDeducted > 0) {
        toast.info(`${res.coinsDeducted} NRs deducted from your balance`, { duration: 4000 });
      }
      toast.success(`${res.messageCount} question${res.messageCount === 1 ? '' : 's'} sent.`);
      await refetchClientBalanceAndStats(queryClient);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHAT.CONVERSATIONS });
      setSelectedQuestionIds([]);
      setCustomLine('');
      setCategoryId('');
      setOpen(false);
      onSuccess(res);
    },
    onError: (err: Error) => {
      if (err.message === 'PROFILE_INCOMPLETE' || err.message === 'INSUFFICIENT_COINS') return;
      toast.error(err.message || 'Failed to send questions');
    },
  });

  const toggleQuestion = (questionId: string, checked: boolean) => {
    setSelectedQuestionIds((prev) =>
      checked ? [...prev, questionId] : prev.filter((id) => id !== questionId)
    );
  };

  if (hideBundle) {
    return null;
  }

  const canSend =
    questionItems.length > 0 && perMessageNr > 0 && !disabled && totalNr <= coinBalance;

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left text-sm font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-gray-800/60 disabled:opacity-50"
      >
        <span className="inline-flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
          Select questions from list (multi-send)
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0" />
        )}
      </button>

      {open && (
        <div className="max-h-[min(48vh,420px)] overflow-y-auto overscroll-contain border-t border-gray-100 dark:border-gray-800">
          <div className="space-y-3 px-4 pb-4 pt-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Choose a category, tick one or more questions, optionally add a short custom line (max
              60 characters). All lines are sent together as one paid bundle.
            </p>

            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">
                Category
              </label>
              <Select
                value={categoryId}
                onValueChange={(v) => {
                  setCategoryId(v === 'CLEAR' ? '' : v);
                  setSelectedQuestionIds([]);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLEAR">
                    <span className="text-gray-400">Clear</span>
                  </SelectItem>
                  {questionCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="inline-flex items-center gap-2">
                        {c.emoji && <span>{c.emoji}</span>}
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {categoryData && (
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">
                  Questions (stack order = send order)
                </label>
                <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white/60 dark:bg-gray-800/50 max-h-[160px] overflow-y-auto p-2 space-y-1">
                  {categoryData.questions.map((q) => (
                    <label
                      key={q.id}
                      className="flex items-start gap-2 cursor-pointer rounded px-2 py-1 text-xs text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedQuestionIds.includes(q.id)}
                        onChange={(e) => toggleQuestion(q.id, e.target.checked)}
                        className="mt-0.5 rounded border-gray-400"
                      />
                      <span>{q.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">
                {selectedQuestionIds.length > 0
                  ? 'Optional extra line (max 60 chars)'
                  : 'Or type one custom question (max 60 chars)'}
              </label>
              <textarea
                value={customLine}
                onChange={(e) => setCustomLine(e.target.value.slice(0, 60))}
                maxLength={60}
                rows={2}
                placeholder="Short custom text…"
                className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
              />
              <p className="text-[10px] text-gray-500 text-right mt-0.5">{customLine.length}/60</p>
            </div>

            {questionItems.length > 0 && perMessageNr > 0 && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10 p-3 space-y-1">
                <div className="flex items-center gap-2 text-sm text-emerald-900 dark:text-emerald-100">
                  <Coins className="h-4 w-4 shrink-0" />
                  <span className="font-semibold">
                    {questionItems.length} × {perMessageNr.toLocaleString()} NRs ={' '}
                    {totalNr.toLocaleString()} NRs
                  </span>
                </div>
                <ul className="max-h-36 overflow-y-auto space-y-1 pl-1 text-xs text-gray-700 dark:text-gray-300">
                  {questionItems.map((q, i) => (
                    <li key={`${q.id}-${i}`} className="break-words">
                      {i + 1}. {q.text}
                    </li>
                  ))}
                </ul>
                {totalNr > coinBalance && (
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Insufficient balance ({coinBalance.toLocaleString()} NRs). Top up to send.
                  </p>
                )}
              </div>
            )}

            <LoadingButton
              type="button"
              onClick={() => sendMutation.mutate()}
              disabled={!canSend || sendMutation.isPending}
              loading={sendMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              Send selected ({questionItems.length} line{questionItems.length === 1 ? '' : 's'})
            </LoadingButton>

            {disabled && (
              <p className="text-xs text-gray-500">
                Wait for the astrologer to reply before sending more, or reconnect to chat.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
