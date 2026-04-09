/**
 * Shared password reset flow for client (User table) and astrologer (Astrologer table).
 * Same logic for both; only table/query layer differs via actor.
 */

import { prisma } from '@jyotish/database';
import { ACTIVE_CLIENT_USER_WHERE } from '../constants/user.constants';
import {
  HTTP_STATUS,
  ERROR_CODES,
  OTP_CONFIG,
  PASSWORD_RESET_ACTOR,
  getFrontendOrigin,
} from '../constants';
import { AppError } from '../middleware/error-handler';
import { isProduction, isDevelopment } from '../utils';
import { authService } from './auth.service';
import { astrologerService } from './astrologer.service';
import { emailService } from './email.service';
import { otpService } from './otp.service';

export type PasswordResetActor =
  (typeof PASSWORD_RESET_ACTOR)[keyof typeof PASSWORD_RESET_ACTOR];

export interface PasswordResetEntity {
  id: string;
  email: string | null;
  phone: string;
  name: string | null;
}

function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, '');
}

const RESET_PATH: Record<PasswordResetActor, string> = {
  [PASSWORD_RESET_ACTOR.USER]: '/auth/reset-password',
  [PASSWORD_RESET_ACTOR.ASTROLOGER]: '/jyotish/forgot-password',
};

const NOT_FOUND_MESSAGE: Record<PasswordResetActor, string> = {
  [PASSWORD_RESET_ACTOR.USER]:
    'No account found with this email or phone number. Please check and try again.',
  [PASSWORD_RESET_ACTOR.ASTROLOGER]:
    'No astrologer account found with this email or phone number. Please check and try again.',
};

const ENTITY_NOT_FOUND_MESSAGE: Record<PasswordResetActor, string> = {
  [PASSWORD_RESET_ACTOR.USER]: 'User not found',
  [PASSWORD_RESET_ACTOR.ASTROLOGER]: 'Astrologer not found',
};

/**
 * Find entity by email or phone – only difference is which table we query.
 */
export async function findEntityByIdentifier(
  identifier: string,
  actor: PasswordResetActor
): Promise<PasswordResetEntity | null> {
  const trimmed = identifier.trim();
  if (actor === PASSWORD_RESET_ACTOR.USER) {
    const user = await authService.findUserByIdentifier(trimmed);
    if (!user) return null;
    return {
      id: user.id,
      email: user.email ?? null,
      phone: user.phone ?? '',
      name: user.name ?? null,
    };
  }
  const astrologer = await astrologerService.findAstrologerByIdentifier(trimmed);
  if (!astrologer) return null;
  return {
    id: astrologer.id,
    email: astrologer.email ?? null,
    phone: astrologer.phone ?? '',
    name: astrologer.name ?? null,
  };
}

/**
 * Generate reset token – same secret/expiry, different payload (userId vs astrologerId).
 */
export function generateResetToken(id: string, actor: PasswordResetActor): string {
  return actor === PASSWORD_RESET_ACTOR.USER
    ? authService.generatePasswordResetToken(id)
    : authService.generateAstrologerResetToken(id);
}

/**
 * Find entity id by phone after OTP – only difference is which table we query.
 */
export async function findEntityIdByPhone(
  phone: string,
  actor: PasswordResetActor
): Promise<string | null> {
  const phoneDigits = normalizePhoneDigits(phone);
  const last10 = phoneDigits.slice(-10);

  if (actor === PASSWORD_RESET_ACTOR.USER) {
    const user = await prisma.user.findFirst({
      where: { phone: last10, ...ACTIVE_CLIENT_USER_WHERE },
      select: { id: true },
    });
    return user?.id ?? null;
  }
  const astrologers = await prisma.astrologer.findMany({
    where: {
      isDeleted: false,
      OR: [{ phone: phoneDigits }, { phone: last10 }, { phone: { contains: last10 } }],
    },
    select: { id: true, phone: true },
    take: 20,
  });
  const match =
    astrologers.find((a) => normalizePhoneDigits(a.phone) === phoneDigits) ||
    astrologers.find((a) => normalizePhoneDigits(a.phone) === last10) ||
    astrologers.find((a) => normalizePhoneDigits(a.phone).endsWith(last10));
  return match?.id ?? null;
}

/**
 * Update password – only difference is which table we update.
 */
export async function updatePassword(
  id: string,
  hashedPassword: string,
  actor: PasswordResetActor
): Promise<void> {
  if (actor === PASSWORD_RESET_ACTOR.USER) {
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  } else {
    await prisma.astrologer.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }
}

/**
 * Shared request reset flow: find by identifier, then send email or OTP.
 * Same logic for both actors; only table lookup and reset URL path differ.
 */
export async function handleRequestPasswordReset(
  identifier: string,
  actor: PasswordResetActor
): Promise<
  | { method: 'email'; message: string }
  | {
      method: 'otp';
      sessionId: string;
      expiresIn: number;
      message: string;
      phoneNumber: string;
      otp?: string;
    }
> {
  const trimmedIdentifier = identifier.trim();
  const isEmailIdentifier = trimmedIdentifier.includes('@');
  const entity = await findEntityByIdentifier(trimmedIdentifier, actor);

  if (!entity) {
    throw new AppError(
      NOT_FOUND_MESSAGE[actor],
      HTTP_STATUS.NOT_FOUND,
      actor === PASSWORD_RESET_ACTOR.USER ? ERROR_CODES.USER_NOT_FOUND : ERROR_CODES.NOT_FOUND
    );
  }

  if (isEmailIdentifier) {
    if (!entity.email) {
      throw new AppError(
        'No email is configured for this account. Please reset via phone number.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const token = generateResetToken(entity.id, actor);
    const path = RESET_PATH[actor];
    const resetUrl = `${getFrontendOrigin()}${path}?token=${encodeURIComponent(token)}`;
    await emailService.sendPasswordResetEmail(entity.name, entity.email, resetUrl);
    return {
      method: 'email',
      message: 'Reset link has been sent to your email.',
    };
  }

  if (!entity.phone) {
    throw new AppError(
      'This account has no email or phone set. Please contact support.',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  if (isProduction()) {
    const isRateLimited = await otpService.checkRateLimit(entity.phone);
    if (isRateLimited) {
      throw new AppError(
        'Too many OTP requests. Please try again later.',
        HTTP_STATUS.TOO_MANY_REQUESTS,
        ERROR_CODES.RATE_LIMIT_EXCEEDED
      );
    }
  }

  const targetPhoneDigits = normalizePhoneDigits(entity.phone).slice(-10);
  const result = await otpService.sendOTP(targetPhoneDigits);
  return {
    method: 'otp',
    sessionId: result.sessionId,
    expiresIn: OTP_CONFIG.OTP_EXPIRY_MINUTES * 60,
    message: 'OTP has been sent to your phone.',
    phoneNumber: targetPhoneDigits,
    ...(isDevelopment() && result.otp && { otp: result.otp }),
  };
}

/**
 * Shared reset-by-token flow: verify token for this actor, update password in correct table.
 */
export async function handleResetPasswordWithToken(
  token: string,
  password: string,
  actor: PasswordResetActor
): Promise<void> {
  const id =
    actor === PASSWORD_RESET_ACTOR.USER
      ? authService.verifyPasswordResetToken(token).userId
      : authService.verifyAstrologerResetToken(token).astrologerId;

  const exists = await (actor === PASSWORD_RESET_ACTOR.USER
    ? prisma.user.findFirst({ where: { id, ...ACTIVE_CLIENT_USER_WHERE }, select: { id: true } })
    : prisma.astrologer.findUnique({ where: { id }, select: { id: true } }));

  if (!exists) {
    throw new AppError(
      ENTITY_NOT_FOUND_MESSAGE[actor],
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.NOT_FOUND
    );
  }

  const hashedPassword = await authService.hashPassword(password);
  await updatePassword(id, hashedPassword, actor);
}

/**
 * Shared reset-by-OTP flow: verify OTP, find by phone in correct table, update password.
 */
export async function handleResetPasswordWithOtp(
  phoneNumber: string,
  otp: string,
  sessionId: string,
  password: string,
  actor: PasswordResetActor
): Promise<void> {
  const verifyResult = await otpService.verifyOTP(sessionId, phoneNumber, otp);
  const id = await findEntityIdByPhone(verifyResult.phoneNumber, actor);

  if (!id) {
    throw new AppError(
      ENTITY_NOT_FOUND_MESSAGE[actor],
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.NOT_FOUND
    );
  }

  const hashedPassword = await authService.hashPassword(password);
  await updatePassword(id, hashedPassword, actor);
}
