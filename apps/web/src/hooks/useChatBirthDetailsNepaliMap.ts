'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserRole } from '@/types';
import type { Message } from '@/types/chat';
import { nepaliDateService } from '@/services/nepali-date.service';
import { toDateKey } from '@/utils/date-format.utils';

function getBirthDetailsFromMessage(message: Message) {
  const metaBirth = message.metadata as Record<string, unknown> | undefined;
  const metaBirthDetails = metaBirth?.birthDetails;
  const birthDetailsFromMeta =
    metaBirthDetails && typeof metaBirthDetails === 'object'
      ? (metaBirthDetails as { dateOfBirth?: string; timeOfBirth?: string; placeOfBirth?: string })
      : null;

  return {
    dateOfBirth: birthDetailsFromMeta?.dateOfBirth ?? message.sender?.dateOfBirth,
    timeOfBirth: birthDetailsFromMeta?.timeOfBirth ?? message.sender?.timeOfBirth,
    placeOfBirth: birthDetailsFromMeta?.placeOfBirth ?? message.sender?.placeOfBirth,
  };
}

function rawDobToString(dob: string | Date | null | undefined): string | null {
  if (dob == null || dob === '') return null;
  if (typeof dob === 'string') return dob;
  if (dob instanceof Date) return dob.toISOString().slice(0, 10);
  return null;
}

/**
 * One batched POST /nepali-date/convert for all unique client DOBs in the visible thread,
 * instead of N per-message useQuery calls from ProfileBirthDetails.
 */
export function useChatBirthDetailsNepaliMap(
  messages: Message[],
  currentUserId: string,
  userRole: UserRole | undefined
) {
  const uniqueSortedKeys = useMemo(() => {
    if (userRole !== UserRole.ASTROLOGER) return [] as string[];
    const keys = new Set<string>();
    for (const m of messages) {
      if ('isSystemMessage' in m && m.isSystemMessage) continue;
      const msg = m as Message;
      if (msg.senderId === currentUserId) continue;
      if (msg.sender?.role !== UserRole.CLIENT) continue;
      const bd = getBirthDetailsFromMessage(msg);
      const raw = rawDobToString(bd.dateOfBirth);
      if (!raw) continue;
      const key = toDateKey(raw);
      if (key) keys.add(key);
    }
    return [...keys].sort();
  }, [messages, currentUserId, userRole]);

  const keyFingerprint = uniqueSortedKeys.join('|');

  const { data: map, isLoading } = useQuery({
    queryKey: ['nepali-date', 'convert', 'chat-thread', keyFingerprint] as const,
    queryFn: () => nepaliDateService.convertBulk(uniqueSortedKeys),
    enabled: uniqueSortedKeys.length > 0,
    staleTime: 1000 * 60 * 60,
  });

  return {
    nepaliConvertMap: map ?? null,
    isNepaliConvertLoading: isLoading,
  };
}
