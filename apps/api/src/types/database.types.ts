/**
 * Database Entity Types - Represents database records
 */

import { User, Notification } from '@jyotish/database';

// UserEntity is an alias for Prisma's User type
export type UserEntity = User;

export interface UserResponse {
  id: string;
  phoneNumber: string | null;
  email?: string | null;
  name?: string | null;
  role: string;
  isActive?: boolean;
  profilePhoto?: string | null;
  profileCompleted: boolean;
  hasPassword: boolean; // Flag to indicate if user has set a password
  dateOfBirth?: Date | null;
  timeOfBirth?: string | null;
  placeOfBirth?: string | null;
  placeOfBirthType?: string | null;
  placeOfBirthPradeshId?: string | null;
  placeOfBirthDistrictId?: string | null;
  placeOfBirthLocation?: string | null;
  currentAddress?: string | null;
  permanentAddress?: string | null;
  zodiacSign?: string | null;
  gender?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsultationEntity {
  id: string;
  clientId: string;
  astrologerId: string;
  scheduledAt: Date;
  duration: number;
  status: string;
  type: string;
  amount: number;
  notes: string | null;
  rating: number | null;
  review: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// NotificationEntity is an alias for Prisma's Notification type
export type NotificationEntity = Notification;

export interface HoroscopeSubscriptionEntity {
  id: string;
  userId: string;
  isActive: boolean;
  frequency: string;
  deliveryTime: string;
  createdAt: Date;
  updatedAt: Date;
}
