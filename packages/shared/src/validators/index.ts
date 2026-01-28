import { z } from 'zod';
import {
  UserRole,
  MessageType,
  ConsultationStatus,
  ConsultationType,
  ZodiacSign,
  NotificationType,
  JyotishBookingType,
  JyotishBookingStatus,
} from '../types';
import { PANDIT_BOOKING_CATEGORIES, VAASTU_BOOKING_CATEGORIES } from '../constants';

// User validators
export const userRegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole).default(UserRole.CLIENT),
});

// Phone number validation helper (Nepali format: 98XXXXXXXX or 97XXXXXXXX)
const nepaliPhoneRegex = /^(98|97)\d{8}$/;
const phoneValidation = z
  .string()
  .min(1, 'Phone number is required')
  .regex(
    nepaliPhoneRegex,
    'Phone number must be a valid 10-digit Nepali number (98XXXXXXXX or 97XXXXXXXX)'
  );

// New phone-based auth validators
export const checkPhoneSchema = z.object({
  phoneNumber: phoneValidation,
});

export const sendOTPSchema = z.object({
  phoneNumber: phoneValidation,
  role: z.nativeEnum(UserRole).optional(),
});

export const verifyOTPSchema = z.object({
  phoneNumber: phoneValidation,
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^[0-9]{6}$/, 'OTP must contain only numbers'),
  sessionId: z.string().uuid('Invalid session ID'),
  role: z.nativeEnum(UserRole).optional(),
});

export const setPasswordSchema = z
  .object({
    tempToken: z.string().min(1, 'Temporary token is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
      .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
      .regex(/(?=.*\d)/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const userLoginSchema = z.object({
  identifier: z.string().min(1, 'Email or phone number is required'), // Can be email or phone
  password: z.string().min(1, 'Password is required'),
});

export const loginWithOTPRequestSchema = z.object({
  phoneNumber: phoneValidation,
});

export const verifyLoginOTPSchema = z.object({
  phoneNumber: phoneValidation,
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^[0-9]{6}$/, 'OTP must contain only numbers'),
  sessionId: z.string().uuid('Invalid session ID'),
});

export const profileSetupSchema = z.preprocess((input) => {
  // Support snake_case keys from some clients (e.g., Flutter FormData)
  if (!input || typeof input !== 'object') return input;
  const obj = input as Record<string, unknown>;
  return {
    ...obj,
    dateOfBirth: obj.dateOfBirth ?? obj.date_of_birth,
    timeOfBirth: obj.timeOfBirth ?? obj.time_of_birth,
    placeOfBirth: obj.placeOfBirth ?? obj.place_of_birth,
    currentAddress: obj.currentAddress ?? obj.current_address,
    permanentAddress: obj.permanentAddress ?? obj.permanent_address,
    zodiacSign: obj.zodiacSign ?? obj.zodiac_sign,
  };
}, z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  dateOfBirth: z.string().or(z.date()),
  timeOfBirth: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  placeOfBirth: z.string().min(2, 'Place of birth is required'),
  currentAddress: z.string().min(5, 'Current address is required'),
  permanentAddress: z.string().min(5, 'Permanent address is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().nullable(),
  zodiacSign: z.nativeEnum(ZodiacSign).optional().nullable(),
}));

export const birthDetailsSchema = z.object({
  dateOfBirth: z.string().or(z.date()),
  timeOfBirth: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  placeOfBirth: z.string().min(2, 'Place of birth is required'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  currentAddress: z.string().optional(),
  permanentAddress: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().nullable(),
  zodiacSign: z.nativeEnum(ZodiacSign).optional().nullable(),
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

// Change password validator
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .regex(/(?=.*[a-z])/, 'New password must contain at least one lowercase letter')
      .regex(/(?=.*[A-Z])/, 'New password must contain at least one uppercase letter')
      .regex(/(?=.*\d)/, 'New password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

// Questionnaires (Question categories and questions)
export const createQuestionCategorySchema = z.object({
  name: z
    .string()
    .min(2, 'Category name must be at least 2 characters')
    .max(100, 'Category name is too long'),
  emoji: z
    .string()
    .max(8, 'Emoji or icon is too long')
    .optional()
    .or(z.literal('')),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  questions: z
    .array(
      z
        .string()
        .min(3, 'Question must be at least 3 characters')
        .max(300, 'Question is too long')
    )
    .min(1, 'Please add at least one question'),
});

export const updateQuestionCategorySchema = createQuestionCategorySchema.partial();

export const listQuestionCategoriesQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((value) => (value ? parseInt(value, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((value) => (value ? parseInt(value, 10) : 10)),
  search: z.string().optional(),
  includeInactive: z
    .preprocess(
      (value) => {
        if (typeof value === 'string') {
          return value === 'true';
        }
        return value;
      },
      z.boolean().optional()
    ),
});

// Astrologer registration validators
// Reuse the phoneValidation from above (lines 24-28)
export const astrologerRegistrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  phone: phoneValidation,
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number'),
  bio: z.string().max(500, 'Bio is too long').optional(),
  specialization: z.array(z.string()).min(1, 'Please enter at least one specialization'),
  experience: z.number().int().min(0, 'Experience cannot be negative').optional(),
  languages: z.array(z.string()).min(1, 'Please enter at least one language').default(['English', 'Nepali']),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().nullable(),
});

export const approveAstrologerRegistrationSchema = z.object({
  category: z.enum(['ORDINARY', 'PROFESSIONAL', 'PREMIUM', 'KATHA_VACHAK']),
  appointmentFee: z.number().positive().optional().nullable(),
  commissionRate: z.number().min(0).max(100, 'Commission rate must be between 0 and 100').optional(),
});

export const rejectAstrologerRegistrationSchema = z.object({
  rejectionReason: z.string().min(10, 'Rejection reason must be at least 10 characters').max(500, 'Rejection reason is too long'),
});

export * from './jyotish-booking.validators';
