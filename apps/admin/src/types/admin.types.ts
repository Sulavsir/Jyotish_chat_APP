/**
 * Admin-specific type definitions
 */

export interface Admin {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Astrologer {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string[];
  experience: number;
  category: 'ORDINARY' | 'PROFESSIONAL' | 'PREMIUM';
  appointmentFee?: number | null;
  rating: number;
  isActive: boolean;
  isOnline: boolean;
  commissionRate: number;
  bio?: string;
  languages?: string[];
  profilePhoto?: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface Chat {
  id: string;
  clientParticipant: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    profilePhoto?: string;
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
  metadata?: any;
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
  details?: Record<string, any>;
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
  profilePhoto?: string | null;
}

export interface AstrologerProfile {
  id: string;
  name: string;
  phone: string;
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
  activeChats: number;
  totalEarnings: number;
  pendingPayouts: number;
  todayConsultations: number;
}

// Form Types
export interface CreateAstrologerForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  specialization: string[];
  experience: number;
  commissionRate: number;
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
  status: BroadcastMessageStatus;
  astrologerId?: string;
  astrologer?: AstrologerProfile;
  chatId?: string;
  acceptedAt: string;
}

export interface ChatAuditChatEndedEvent {
  id: string;
  chatId: string;
  requestType: ChatAuditType | 'DIRECT_CHAT';
  chatStatus: 'ENDED';
  chatEndedBy: string;
  chatEndedAt: string;
}
