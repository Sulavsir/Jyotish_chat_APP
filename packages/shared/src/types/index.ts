// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  phoneNumber?: string; // Alias for phone (for compatibility)
  profilePhoto?: string | null;

  // Birth details (flattened for easier access)
  dateOfBirth?: string | Date;
  timeOfBirth?: string;
  placeOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  zodiacSign?: ZodiacSign | null;

  // Address fields
  currentAddress?: string;
  permanentAddress?: string;

  // Account status
  profileCompleted?: boolean;
  hasPassword?: boolean;

  // Astrologer-specific data (when role is ASTROLOGER)
  astrologer?: {
    id: string;
    category: AstrologerCategory;
    appointmentFee?: number | null;
  };

  birthDetails?: BirthDetails;
  createdAt: Date;
  updatedAt: Date;
}

export enum AstrologerCategory {
  ORDINARY = 'ORDINARY',
  PROFESSIONAL = 'PROFESSIONAL',
  PREMIUM = 'PREMIUM',
  KATHA_VACHAK = 'KATHA_VACHAK',
}

export enum UserRole {
  CLIENT = 'CLIENT',
  ASTROLOGER = 'ASTROLOGER',
  ADMIN = 'ADMIN',
}

export type AstrologersType = {
  id: string;
  name: string;
  email: string;
  phone: string;
  profilePhoto: string | null;
  isOnline: boolean;
  category: AstrologerCategory;
  createdAt: Date;
};
export interface BirthDetails {
  dateOfBirth: Date;
  timeOfBirth: string;
  placeOfBirth: string;
  latitude?: number;
  longitude?: number;
}

// Dashboard types
export interface DashboardRotatingCopy {
  id: string;
  title: string;
  subtitle: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Jyotish booking types
export enum JyotishBookingType {
  PANDIT = 'PANDIT',
  VAASTU = 'VAASTU',
  KATHA_VACHAK = 'KATHA_VACHAK',
}

export enum JyotishBookingStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface JyotishBookingRequest {
  id: string;
  clientId: string;
  type: JyotishBookingType;
  preferredAstrologerId?: string | null;
  category: string;
  bookingDate: Date;
  details?: string | null;
  location: string;
  status: JyotishBookingStatus;
  adminNotes?: string | null;
  decidedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Chat types
export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: MessageType;
  metadata?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  AUDIO = 'AUDIO',
}

// Consultation types
export interface Consultation {
  id: string;
  clientId: string;
  astrologerId: string;
  scheduledAt: Date;
  duration: number; // in minutes
  status: ConsultationStatus;
  type: ConsultationType;
  amount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum ConsultationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ConsultationType {
  CHAT = 'CHAT',
  VOICE = 'VOICE',
  VIDEO = 'VIDEO',
}

// Horoscope types
export interface Horoscope {
  id: string;
  zodiacSign: ZodiacSign;
  date: Date;
  content: string;
  category: HoroscopeCategory;
  createdAt: Date;
}

export enum ZodiacSign {
  ARIES = 'ARIES',
  TAURUS = 'TAURUS',
  GEMINI = 'GEMINI',
  CANCER = 'CANCER',
  LEO = 'LEO',
  VIRGO = 'VIRGO',
  LIBRA = 'LIBRA',
  SCORPIO = 'SCORPIO',
  SAGITTARIUS = 'SAGITTARIUS',
  CAPRICORN = 'CAPRICORN',
  AQUARIUS = 'AQUARIUS',
  PISCES = 'PISCES',
}

export enum HoroscopeCategory {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export enum NotificationType {
  CHAT_MESSAGE = 'CHAT_MESSAGE',
  BROADCAST_MESSAGE = 'BROADCAST_MESSAGE',
  BROADCAST_ACCEPTED = 'BROADCAST_ACCEPTED',
  CONSULTATION_BOOKING = 'CONSULTATION_BOOKING',
  CONSULTATION_REMINDER = 'CONSULTATION_REMINDER',
  HOROSCOPE = 'HOROSCOPE',
  PAYMENT = 'PAYMENT',
  SYSTEM = 'SYSTEM',
}

// Payment types
export interface Payment {
  id: string;
  userId: string;
  consultationId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string;
  transactionId?: string;
  createdAt: Date;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

// Questionnaires (Question categories and questions)
export interface QuestionnaireQuestion {
  id: string;
  categoryId: string;
  text: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface QuestionnaireCategory {
  id: string;
  name: string;
  emoji?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  questions: QuestionnaireQuestion[];
}

// WebSocket event types
export interface SocketEvents {
  // Client to server
  'chat:send': (data: { receiverId: string; content: string; type: MessageType }) => void;
  'chat:typing': (data: { receiverId: string; isTyping: boolean }) => void;
  'user:online': () => void;
  'user:offline': () => void;

  // Server to client
  'chat:receive': (message: ChatMessage) => void;
  'chat:typing-indicator': (data: { senderId: string; isTyping: boolean }) => void;
  'notification:new': (notification: Notification) => void;
  'user:status': (data: { userId: string; status: 'online' | 'offline' }) => void;
  'consultation:update': (consultation: Consultation) => void;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
