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
    currentAddress: user.currentAddress,
    permanentAddress: user.permanentAddress,
    zodiacSign: user.zodiacSign,
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
    currentAddress: entity.currentAddress,
    permanentAddress: entity.permanentAddress,
    zodiacSign: entity.zodiacSign,
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
