// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  birthDetails?: BirthDetails;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  CLIENT = 'CLIENT',
  ASTROLOGER = 'ASTROLOGER',
  ADMIN = 'ADMIN',
}

export interface BirthDetails {
  dateOfBirth: Date;
  timeOfBirth: string;
  placeOfBirth: string;
  latitude?: number;
  longitude?: number;
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

