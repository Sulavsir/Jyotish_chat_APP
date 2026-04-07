import { AstrologerCategory } from '@jyotish/shared';
import { BroadcastMessageStatus, prisma } from '@jyotish/database';
import { settingsService } from './settings.service';
import { SETTINGS_KEYS } from '../constants/settings.constants';
import { acceptBroadcastMessage } from './broadcastMessage.service';
import { AppError } from '../middleware/error-handler';
import { ERROR_CODES, HTTP_STATUS } from '../constants';
import { getBroadcastRuntimeSettings } from './broadcastRuntimeSettings.service';

const MIN_EXPIRY_MINUTES = 1;
const MAX_EXPIRY_MINUTES = 120;
const MIN_ACCEPTANCE_LIMIT = 0;
const MAX_ACCEPTANCE_LIMIT = 100;

export async function getAdminBroadcastSettings() {
  const settings = await getBroadcastRuntimeSettings();

  const [pendingBroadcasts, onlineAstrologers] = await Promise.all([
    prisma.broadcastMessage.findMany({
      where: { status: BroadcastMessageStatus.PENDING },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        expiresAt: true,
        clientId: true,
        client: {
          select: { id: true, name: true, phone: true, email: true, profilePhoto: true },
        },
      },
      take: 200,
    }),
    prisma.astrologer.findMany({
      where: {
        isDeleted: false,
        isActive: true,
        isOnline: true,
        inhouseAstrologer: true,
        category: { in: [AstrologerCategory.ORDINARY, AstrologerCategory.PROFESSIONAL] },
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        category: true,
        isOnline: true,
        inhouseAstrologer: true,
      },
    }),
  ]);

  return {
    settings,
    pendingBroadcasts,
    onlineAstrologers,
  };
}

export async function updateAdminBroadcastSettings(input: {
  expiryMinutes: number;
  acceptanceLimitOrdinary: number;
  acceptanceLimitProfessional: number;
}) {
  const expiryMinutes = Math.max(
    MIN_EXPIRY_MINUTES,
    Math.min(MAX_EXPIRY_MINUTES, Math.floor(input.expiryMinutes))
  );
  const acceptanceLimitOrdinary = Math.max(
    MIN_ACCEPTANCE_LIMIT,
    Math.min(MAX_ACCEPTANCE_LIMIT, Math.floor(input.acceptanceLimitOrdinary))
  );
  const acceptanceLimitProfessional = Math.max(
    MIN_ACCEPTANCE_LIMIT,
    Math.min(MAX_ACCEPTANCE_LIMIT, Math.floor(input.acceptanceLimitProfessional))
  );

  await Promise.all([
    settingsService.upsertByKey(SETTINGS_KEYS.BROADCAST_EXPIRY_MINUTES, String(expiryMinutes)),
    settingsService.upsertByKey(
      SETTINGS_KEYS.BROADCAST_ACCEPTANCE_LIMIT_ORDINARY,
      String(acceptanceLimitOrdinary)
    ),
    settingsService.upsertByKey(
      SETTINGS_KEYS.BROADCAST_ACCEPTANCE_LIMIT_PROFESSIONAL,
      String(acceptanceLimitProfessional)
    ),
  ]);

  return {
    settings: {
      expiryMinutes,
      acceptanceLimitOrdinary,
      acceptanceLimitProfessional,
    },
  };
}

export async function assignPendingBroadcastByAdmin(params: {
  messageId: string;
  astrologerId: string;
}) {
  const existingMessage = await prisma.broadcastMessage.findUnique({
    where: { id: params.messageId },
    select: { metadata: true },
  });

  const existingMetadata =
    existingMessage?.metadata && typeof existingMessage.metadata === 'object'
      ? (existingMessage.metadata as Record<string, unknown>)
      : {};

  const astrologer = await prisma.astrologer.findUnique({
    where: { id: params.astrologerId },
    select: {
      id: true,
      isOnline: true,
      isDeleted: true,
      isActive: true,
      inhouseAstrologer: true,
    },
  });

  if (!astrologer || astrologer.isDeleted || !astrologer.isActive) {
    throw new AppError('Astrologer not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  if (!astrologer.isOnline) {
    throw new AppError(
      'Only online astrologers can be assigned pending broadcasts',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }
  if (!astrologer.inhouseAstrologer) {
    throw new AppError(
      'Only in-house astrologers can be assigned pending broadcasts',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const accepted = await acceptBroadcastMessage({
    messageId: params.messageId,
    astrologerId: params.astrologerId,
  });

  await prisma.broadcastMessage.update({
    where: { id: params.messageId },
    data: {
      metadata: {
        ...existingMetadata,
        assignedByAdmin: true,
        assignedByAdminAt: new Date().toISOString(),
      },
    },
  });

  return { accepted, assignedByAdmin: true };
}

