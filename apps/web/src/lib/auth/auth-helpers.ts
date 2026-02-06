/**
 * Auth Helper Functions
 *
 * Utility functions for handling authentication responses and tokens
 */

import type {
  LoginResponse,
  VerifyOTPResponse,
  VerifyLoginOTPResponse,
  SetPasswordResponse,
} from '@/types/auth';
import type { User } from '@jyotish/shared';
import { UserRole, AstrologerCategory } from '@jyotish/shared';
import {
  canAcceptAppointments as canAcceptAppointmentsFromCategory,
  canAcceptBroadcastMessages as canAcceptBroadcastFromCategory,
} from '@jyotish/shared';

type AuthResponse =
  | LoginResponse
  | VerifyOTPResponse
  | VerifyLoginOTPResponse
  | SetPasswordResponse;

/**
 * Astrologer profile as returned by GET /astrologer/auth/me (flat shape).
 * Category and permission flags are at top level; same semantics as User.astrologer.
 */
export interface AstrologerProfileFromMe extends Pick<User, 'id' | 'name' | 'email' | 'role'> {
  category?: AstrologerCategory | string;
  canAccessAppointments?: boolean;
  canAcceptBroadcastMessages?: boolean;
  astrologer?: User['astrologer'];
}

/** User or astrologer profile from /me — nested (users/me) or flat (astrologer/auth/me). */
export type UserOrAstrologerProfile = User | AstrologerProfileFromMe;

function getRole(user: UserOrAstrologerProfile | null): string | undefined {
  return user?.role;
}

function getCategory(user: UserOrAstrologerProfile | null): AstrologerCategory | string | null {
  if (!user) return null;
  const u = user as User & { category?: AstrologerCategory | string };
  return u.astrologer?.category ?? u.category ?? null;
}

function getCanAccessAppointmentsFromApi(
  user: UserOrAstrologerProfile | null
): boolean | undefined {
  if (!user) return undefined;
  const u = user as User & { canAccessAppointments?: boolean };
  return u.astrologer?.canAccessAppointments ?? u.canAccessAppointments;
}

function getCanAcceptBroadcastFromApi(
  user: UserOrAstrologerProfile | null
): boolean | undefined {
  if (!user) return undefined;
  const u = user as User & { canAcceptBroadcastMessages?: boolean };
  return u.astrologer?.canAcceptBroadcastMessages ?? u.canAcceptBroadcastMessages;
}

/**
 * Extract access and refresh tokens from auth response
 * Handles both new format (accessToken/refreshToken) and legacy format (token)
 */
export function extractTokens(response: AuthResponse): {
  accessToken: string;
  refreshToken: string;
} {
  if ('accessToken' in response && 'refreshToken' in response) {
    return {
      accessToken: response.accessToken as string,
      refreshToken: response.refreshToken as string,
    };
  }
  if ('token' in response && response.token) {
    return {
      accessToken: response.token as string,
      refreshToken: response.token as string,
    };
  }
  throw new Error('No tokens found in auth response');
}

/**
 * Check if response contains new token format
 */
export function hasNewTokenFormat(response: AuthResponse): boolean {
  return 'accessToken' in response && 'refreshToken' in response;
}

/**
 * Get astrologer category from user (from /me or /astrologer/auth/me stored in Zustand).
 * Use this instead of cookies so it works in production when API is on a different domain.
 */
export function getAstrologerCategoryFromUser(
  user: UserOrAstrologerProfile | null
): AstrologerCategory | string | null {
  if (!user || getRole(user) !== UserRole.ASTROLOGER) return null;
  return getCategory(user);
}

/**
 * Result of resolving astrologer permissions from stored user (from /me).
 */
export interface AstrologerPermissions {
  canAccessAppointments: boolean;
  canAcceptBroadcastMessages: boolean;
  category: AstrologerCategory | string | null;
}

/**
 * Get appointment and broadcast permissions from user (backend-derived from /me).
 * Handles both nested (users/me) and flat (astrologer/auth/me) response shapes.
 * Falls back to shared category-based logic when API does not return flags (e.g. old cached user).
 */
export function getAstrologerPermissionsFromUser(
  user: UserOrAstrologerProfile | null
): AstrologerPermissions {
  const category = getAstrologerCategoryFromUser(user);
  const fromApiAppointments = getCanAccessAppointmentsFromApi(user);
  const fromApiBroadcast = getCanAcceptBroadcastFromApi(user);

  const canAccessAppointments =
    fromApiAppointments ??
    (category != null ? canAcceptAppointmentsFromCategory(category) : false);

  const canAcceptBroadcastMessages =
    fromApiBroadcast ??
    (category != null ? canAcceptBroadcastFromCategory(category) : false);

  return {
    category,
    canAccessAppointments,
    canAcceptBroadcastMessages,
  };
}

/**
 * Whether the stored user has astrologer permission data (from /me).
 * Used to decide if we need to refetch profile on jyotish routes (e.g. old persisted state).
 */
export function hasAstrologerPermissionData(user: UserOrAstrologerProfile | null): boolean {
  if (!user || getRole(user) !== UserRole.ASTROLOGER) return false;
  const fromApi =
    getCanAccessAppointmentsFromApi(user) !== undefined ||
    getCanAcceptBroadcastFromApi(user) !== undefined;
  const fromCategory = getCategory(user) != null;
  return fromApi || fromCategory;
}
