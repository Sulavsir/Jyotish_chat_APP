/**
 * Frontend Type Definitions
 * Re-export shared types and add frontend-specific types
 */

import type { User, ChatMessage, Notification, ConsultationType } from '@jyotish/shared';

export * from '@jyotish/shared';
export * from './user.types';
export * from './auth';
export * from './chat';

// Frontend-specific types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown; // Use unknown for type safety with error details
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ChatState {
  conversations: Conversation[];
  activeChat: string | null;
  messages: Record<string, ChatMessage[]>;
  onlineUsers: Set<string>;
  typingUsers: Set<string>;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

export interface Conversation {
  userId: string;
  userName: string;
  userEmail: string;
  userImage?: string;
  lastMessage: string;
  lastMessageTime: Date;
  isRead: boolean;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone?: string;
}

export interface BirthDetailsFormData {
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  latitude?: number;
  longitude?: number;
}

export interface ConsultationFormData {
  astrologerId: string;
  scheduledAt: string;
  duration: number;
  type: ConsultationType;
  notes?: string;
}

// Note: Already exported from '@jyotish/shared' with 'export *'
// The following are for explicit type references if needed
export type {
  User,
  ChatMessage,
  Consultation,
  Horoscope,
  Notification,
  ZodiacSign,
  ConsultationType,
  ConsultationStatus,
  MessageType,
  NotificationType,
} from '@jyotish/shared';

// Export UserRole separately to ensure it's available as both type and value
export { UserRole } from '@jyotish/shared';
