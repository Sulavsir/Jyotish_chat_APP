/**
 * Broadcast Message Types
 * Types for broadcast chat/instant chat requests
 */

import { MessageType } from '@jyotish/shared';

export { MessageType };

export enum BroadcastMessageStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export interface BroadcastMessageClient {
  id: string;
  name: string | null;
  phone: string;
  profilePhoto: string | null;
}

export interface BroadcastMessageAstrologer {
  id: string;
  name: string;
  phone: string;
  profilePhoto: string | null;
}

export interface BroadcastMessage {
  id: string;
  clientId: string;
  content: string;
  type: MessageType;
  status: BroadcastMessageStatus;
  acceptedBy: string | null;
  chatId: string | null;
  acceptedAt: Date | string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  client?: BroadcastMessageClient;
  acceptedAstrologer?: BroadcastMessageAstrologer | null;
}

export interface CreateBroadcastMessageRequest {
  content: string;
  type?: MessageType;
  metadata?: Record<string, unknown>;
}

export interface AcceptBroadcastMessageResponse {
  message: BroadcastMessage;
  chat: {
    id: string;
    status: string;
    createdAt: Date | string;
  };
  initialMessages: Array<{
    id: string;
    content: string;
    type: MessageType;
    createdAt: Date | string;
  }>;
}

export interface DismissBroadcastMessageResponse {
  success: boolean;
  messageId: string;
  dismissedAt: Date | string;
}

export interface CancelBroadcastMessageResponse {
  success: boolean;
  messageId: string;
  message: BroadcastMessage;
}

export interface BroadcastMessageListResponse {
  success: boolean;
  data: BroadcastMessage[];
}

export interface BroadcastMessageResponse {
  success: boolean;
  data: BroadcastMessage;
}

// Multi-question broadcast (pricing, prepare, send)
export interface BroadcastQuestionPricingTier {
  id: string;
  questionCount: number;
  amountNr: number;
  createdAt: string;
  updatedAt: string;
}

export interface BroadcastQuestionPricingResponse {
  tiers: BroadcastQuestionPricingTier[];
}

export interface BroadcastPriceBreakdownEntry {
  position: number;
  price: number;
  isDiscounted: boolean;
  tierApplied: boolean;
}

export interface PrepareBroadcastQuestionsResponse {
  totalNr: number;
  /** Full price without first-broadcast discount */
  originalTotalNr: number;
  /** Overall discount percentage applied (0 if none) */
  discountPercentApplied: number;
  /** Per-question price list */
  breakdown: BroadcastPriceBreakdownEntry[];
  balanceNr: number;
  coveredByBalance: number;
  remainingNr: number;
  questionCount: number;
  questions: { id: string; text: string }[];
}

export interface SendBroadcastQuestionsRequest {
  questionItems: { id: string; text: string }[];
  totalNr: number;
  birthDetails?: {
    dateOfBirth?: string;
    timeOfBirth?: string;
    placeOfBirth?: string;
    gender?: string;
  };
}

export interface SendBroadcastQuestionsResponse {
  messageIds: string[];
  count: number;
}
