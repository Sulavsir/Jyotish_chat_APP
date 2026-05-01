/**
 * Admin-specific type definitions
 */

import type { AdminRole } from '@jyotish/shared';

export interface Admin {
  id: string;
  email: string;
  name: string;
  /** Omitted in older persisted sessions — treated as FULL. */
  adminRole?: AdminRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Astrologer {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  specialization: string[];
  experience: number | null;
  category: 'ORDINARY' | 'PROFESSIONAL' | 'PREMIUM' | 'KATHA_VACHAK';
  appointmentFee?: number | null;
  chatMessageFee?: number | null;
  rating: number;
  isActive: boolean;
  isOnline: boolean;
  chatMessageCommissionPercent: number;
  broadcastMessageCommissionPercent: number;
  firstBroadcastCommissionPercent: number;
  kundaliReviewCommissionPercent: number;
  appointmentCommissionPercent: number;
  inhouseAstrologer: boolean;
  bio?: string | null;
  address?: string | null;
  languages?: string[];
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  profilePhoto?: string | null;
  proofOfAstrology?: string | null;
  country?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  profileCompleted: boolean;
  profilePhoto?: string;
  dateOfBirth?: string;
  coins?: number;
  totalBalanceLoaded?: number;
  createdAt: string;
  updatedAt: string;
}

/** How the client↔astrologer chat thread was opened (monitor list/detail). */
export type AdminMonitorChatOrigin = 'BROADCAST' | 'DIRECT' | 'MIXED';

export interface Chat {
  id: string;
  /** Set by GET /admin/chats monitor list — from BroadcastMessage / InstantChatRequest links. */
  chatOrigin?: AdminMonitorChatOrigin;
  clientParticipant: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    profilePhoto?: string;
    /** ISO date string — same as GET /users/:id/details for astrologers */
    dateOfBirth?: string | null;
    timeOfBirth?: string | null;
    placeOfBirth?: string | null;
  };
  astrologerParticipant: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    profilePhoto?: string;
  };
  lastMessageText?: string | null;
  lastMessageAt?: string | null;
  status: string;
  isLocked?: boolean;
  isAbandonedByAdmin?: boolean;
  abandonedBy?: string | null;
  abandonedAt?: string | null;
  abandonReason?: string | null;
  _count?: {
    messages: number;
  };
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  senderType: 'CLIENT' | 'ASTROLOGER';
  receiverType: 'CLIENT' | 'ASTROLOGER';
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO';
  metadata?: Record<string, unknown>;
  isRead: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorId: string;
  actorType: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export type BroadcastMessageStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED';
export type InstantChatRequestStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
export type ChatAuditStatus = BroadcastMessageStatus | InstantChatRequestStatus;
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO';
export type ChatAuditType = 'BROADCAST_MESSAGE' | 'INSTANT_CHAT_REQUEST';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  profilePhoto?: string | null;
}

export interface AstrologerProfile {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  profilePhoto?: string | null;
}

export interface ChatAuditMetadata {
  chatStatus?: 'ACTIVE' | 'ENDED';
  chatEndedAt?: string;
  chatEndedBy?: string;
  [key: string]: unknown;
}

export interface ChatAuditLog {
  id: string;
  type: ChatAuditType;
  action: ChatAuditStatus;
  status: ChatAuditStatus;
  client: UserProfile;
  astrologer?: AstrologerProfile | null;
  content?: string;
  messageType?: MessageType;
  metadata?: ChatAuditMetadata | null;
  createdAt: string;
  acceptedAt?: string | null;
  chatId?: string | null;
  expiresAt?: string | null;
}

export interface Earning {
  id: string;
  astrologer: {
    id: string;
    name: string;
  };
  amount: number;
  commission: number;
  netEarning: number;
  status: 'PENDING' | 'PAID' | 'PROCESSING';
  createdAt: string;
  paidAt?: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalAstrologers: number;
  /** Pending registration approvals — matches sidebar badge / GET sidebar-counts */
  pendingAstrologerRegistrations: number;
  activeChats: number;
  /** In-house astrologers currently marked online */
  onlineAstrologers: number;
  totalEarnings: number;
  todayConsultations: number;
  newUsersToday: number;
  todayEarnings: number;
  platformTotalLoaded: number;
  platformTodayLoaded: number;
}

/** GET /admin/coin-transactions query */
export interface AdminPaymentHistoryListParams {
  page?: number;
  limit?: number;
  search?: string;
  paymentMethod?: string;
  paymentDateFrom?: string;
  paymentDateTo?: string;
}

// Form Types
export interface CreateAstrologerForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  specialization: string[];
  experience: number;
  chatMessageCommissionPercent: number;
  broadcastMessageCommissionPercent: number;
  firstBroadcastCommissionPercent: number;
  kundaliReviewCommissionPercent: number;
  appointmentCommissionPercent: number;
  bio?: string;
  languages?: string[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    message: string;
    code: string;
  };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

// Chat Audit API Response
export interface ChatAuditListResponse {
  logs: ChatAuditLog[];
  pagination: Pagination;
}

export interface ChatAuditStatsResponse {
  stats: {
    broadcast: {
      total: number;
      pending: number;
      accepted: number;
      expired: number;
    };
    instantChat: {
      total: number;
      pending: number;
      accepted: number;
      expired: number;
      cancelled: number;
    };
    overall: {
      total: number;
      pending: number;
      accepted: number;
      expired: number;
    };
  };
}

// Audit Log API Response
export interface AuditLogListResponse {
  logs: AuditLog[];
  pagination: Pagination;
}

// Socket Event Types
export interface ChatAuditNewEvent {
  id: string;
  type: 'BROADCAST_MESSAGE';
  action: BroadcastMessageStatus;
  status: BroadcastMessageStatus;
  client: UserProfile;
  astrologer: null;
  content: string;
  messageType: MessageType;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  acceptedAt: null;
}

export interface ChatAuditUpdateEvent {
  id: string;
  status: ChatAuditStatus;
  astrologerId?: string;
  astrologer?: AstrologerProfile;
  chatId?: string;
  acceptedAt?: string;
  expiredAt?: string;
  cancelledAt?: string;
}

export interface ChatAuditChatEndedEvent {
  id: string;
  chatId: string;
  requestType: ChatAuditType | 'DIRECT_CHAT';
  chatStatus: 'ENDED';
  chatEndedBy: string;
  chatEndedAt: string;
}

// Coin Settings (platform coin rates)
export type PlatformCoinRateType =
  | 'CHAT_PER_MESSAGE'
  | 'BROADCAST_PER_MESSAGE'
  | 'BROADCAST_SEND'
  | 'APPOINTMENT'
  | 'KUNDALI_REVIEW'
  | 'KUNDALI_MATCH'
  | 'COINS_PER_NPR'
  | 'FIRST_BROADCAST_DISCOUNT';

export interface PlatformCoinRateRow {
  id: string;
  rateType: PlatformCoinRateType;
  coins: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePlatformCoinRatesBody {
  CHAT_PER_MESSAGE?: number;
  BROADCAST_PER_MESSAGE?: number;
  BROADCAST_SEND?: number;
  APPOINTMENT?: number;
  KUNDALI_REVIEW?: number;
  KUNDALI_MATCH?: number;
  COINS_PER_NPR?: number;
}

// Admin earnings: total balance credited (NRs) per astrologer; API field totalCoinEarnings
export interface AstrologerWithCoinEarning {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  category: string;
  rating: number | null;
  totalCoinEarnings: number;
  chatMessageCommissionPercent: number;
  broadcastMessageCommissionPercent: number;
  firstBroadcastCommissionPercent: number;
  kundaliReviewCommissionPercent: number;
  appointmentCommissionPercent: number;
}

export interface ListAstrologersWithCoinEarningsResponse {
  astrologers: AstrologerWithCoinEarning[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BroadcastQuestionPricingTier {
  id: string;
  questionCount: number;
  amountNr: number;
  createdAt: string;
  updatedAt: string;
}

/** Admin payment history – successful payments only (PAYMENT_SUCCESS) */
export interface AdminPaymentHistoryItem {
  id: string;
  userId: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  paymentId: string | null;
  paymentMethod: string | null;
  transactionId: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string;
  };
}

export interface AdminPaymentHistoryResponse {
  transactions: AdminPaymentHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
