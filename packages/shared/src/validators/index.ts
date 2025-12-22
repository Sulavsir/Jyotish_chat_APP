import { z } from 'zod';
import { UserRole, MessageType, ConsultationStatus, ConsultationType, ZodiacSign, NotificationType } from '../types';

// User validators
export const userRegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole).default(UserRole.CLIENT),
});

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const birthDetailsSchema = z.object({
  dateOfBirth: z.string().or(z.date()),
  timeOfBirth: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  placeOfBirth: z.string().min(2, 'Place of birth is required'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

// Chat validators
export const sendMessageSchema = z.object({
  receiverId: z.string().uuid('Invalid receiver ID'),
  content: z.string().min(1, 'Message content is required').max(5000, 'Message too long'),
  type: z.nativeEnum(MessageType).default(MessageType.TEXT),
  metadata: z.record(z.any()).optional(),
});

export const getChatHistorySchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

// Consultation validators
export const createConsultationSchema = z.object({
  astrologerId: z.string().uuid('Invalid astrologer ID'),
  scheduledAt: z.string().or(z.date()),
  duration: z.number().int().positive().min(15).max(180),
  type: z.nativeEnum(ConsultationType),
  notes: z.string().max(500).optional(),
});

export const updateConsultationSchema = z.object({
  scheduledAt: z.string().or(z.date()).optional(),
  duration: z.number().int().positive().min(15).max(180).optional(),
  status: z.nativeEnum(ConsultationStatus).optional(),
  notes: z.string().max(500).optional(),
});

// Horoscope validators
export const createHoroscopeSchema = z.object({
  zodiacSign: z.nativeEnum(ZodiacSign),
  date: z.string().or(z.date()),
  content: z.string().min(50, 'Horoscope content must be at least 50 characters'),
  category: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
});

export const getHoroscopeSchema = z.object({
  zodiacSign: z.nativeEnum(ZodiacSign),
  date: z.string().optional(),
  category: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).default('DAILY'),
});

// Notification validators
export const createNotificationSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  type: z.nativeEnum(NotificationType),
  metadata: z.record(z.any()).optional(),
});

// Payment validators
export const createPaymentSchema = z.object({
  consultationId: z.string().uuid().optional(),
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  paymentMethod: z.string(),
});

// Query validators
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

