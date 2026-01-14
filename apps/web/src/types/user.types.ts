/**
 * User related types and enums
 */

// User Role Enum (matches Prisma schema)
export enum UserRole {
  CLIENT = 'CLIENT',
  ASTROLOGER = 'ASTROLOGER',
  ADMIN = 'ADMIN',
}

// User Role Type
export type UserRoleType = UserRole | 'CLIENT' | 'ASTROLOGER' | 'ADMIN';

// User Interface - extends shared User type
export interface User {
  id: string;
  name: string | null;
  email?: string | null;
  phone?: string;
  phoneNumber?: string;
  profilePhoto?: string | null;
  role: UserRoleType;
  zodiacSign?: string;
  dateOfBirth?: string;
  timeOfBirth?: string;
  placeOfBirth?: string;
  currentAddress?: string;
  permanentAddress?: string;
  profileCompleted?: boolean;
  hasPassword?: boolean;
  isActive?: boolean;
  coins?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  // astrologer field comes from @jyotish/shared User type
}

// User with minimal info (for lists)
export interface UserBasicInfo {
  id: string;
  name: string | null;
  email?: string | null;
  phone?: string;
  profilePhoto?: string | null;
  role: UserRoleType;
  zodiacSign?: string;
}
