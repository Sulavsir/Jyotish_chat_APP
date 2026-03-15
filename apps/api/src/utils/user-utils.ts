/**
 * User Utility Functions
 */

import { UserResponse, UserEntity } from '../types/database.types';
import { User } from '@prisma/client';

/**
 * Converts a Prisma User model to UserResponse, excluding sensitive fields like password
 * Accepts User with optional password field
 */
export function toUserResponse(user: User | (User & { password?: string | null })): UserResponse {
  const hasPassword = 'password' in user ? !!user.password : false;

  return {
    id: user.id,
    phoneNumber: user.phone,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    profilePhoto: user.profilePhoto,
    profileCompleted: user.profileCompleted,
    hasPassword, // Flag to indicate if user has set a password
    dateOfBirth: user.dateOfBirth,
    timeOfBirth: user.timeOfBirth,
    placeOfBirth: user.placeOfBirth,
    placeOfBirthType: (user as any).placeOfBirthType ?? null,
    placeOfBirthPradeshId: (user as any).placeOfBirthPradeshId ?? null,
    placeOfBirthDistrictId: (user as any).placeOfBirthDistrictId ?? null,
    placeOfBirthLocation: (user as any).placeOfBirthLocation ?? null,
    currentAddress: user.currentAddress,
    permanentAddress: user.permanentAddress,
    zodiacSign: user.zodiacSign,
    gender: (user as any).gender ?? null,
    latitude: (user as any).latitude ?? null,
    longitude: (user as any).longitude ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Converts a UserEntity to UserResponse, excluding sensitive fields
 */
export function entityToUserResponse(entity: UserEntity): UserResponse {
  return {
    id: entity.id,
    phoneNumber: entity.phone,
    email: entity.email,
    name: entity.name,
    role: entity.role,
    isActive: entity.isActive,
    profilePhoto: entity.profilePhoto,
    profileCompleted: entity.profileCompleted,
    hasPassword: !!entity.password,
    dateOfBirth: entity.dateOfBirth,
    timeOfBirth: entity.timeOfBirth,
    placeOfBirth: entity.placeOfBirth,
    placeOfBirthType: (entity as any).placeOfBirthType ?? null,
    placeOfBirthPradeshId: (entity as any).placeOfBirthPradeshId ?? null,
    placeOfBirthDistrictId: (entity as any).placeOfBirthDistrictId ?? null,
    placeOfBirthLocation: (entity as any).placeOfBirthLocation ?? null,
    currentAddress: entity.currentAddress,
    permanentAddress: entity.permanentAddress,
    zodiacSign: entity.zodiacSign,
    gender: (entity as any).gender ?? null,
    latitude: (entity as any).latitude ?? null,
    longitude: (entity as any).longitude ?? null,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

/**
 * Converts multiple User models to UserResponse array
 */
export function toUserResponseArray(users: User[]): UserResponse[] {
  return users.map(toUserResponse);
}
