/**
 * Instant Chat Request Service
 * Handles instant chat requests similar to ride-sharing apps
 * Client requests -> Broadcast to all online astrologers -> First to accept gets the chat
 */

import { prisma } from '@jyotish/database';
import { InstantChatRequestStatus, AuditAction } from '@prisma/client';
import { AstrologerCategory } from '@jyotish/shared';
import {
  notifyInstantChatRequestCreated,
  notifyInstantChatRequestAccepted,
  notifyInstantChatRequestCancelled,
} from '../utils';
import { auditService } from './audit.service';
import { AppError } from '../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import { deductCoinsForChat } from './coin.service';
import { requiresCoinsForChat } from '../constants/coin.constants';

/**
 * Create an instant chat request
 * @param clientId - ID of the client requesting chat
 * @param message - Optional message from client
 * @returns Created instant chat request
 */
export const createInstantChatRequest = async (clientId: string, message?: string) => {
  // Check if client already has an active request
  const existingRequest = await prisma.instantChatRequest.findFirst({
    where: {
      clientId,
      status: InstantChatRequestStatus.PENDING,
      expiresAt: {
        gte: new Date(),
      },
    },
  });

  if (existingRequest) {
    throw new Error('You already have an active instant chat request');
  }

  // Get client info
  const client = await prisma.user.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      name: true,
      profilePhoto: true,
    },
  });

  if (!client) {
    throw new Error('Client not found');
  }

  // Create request that expires in 3 minutes
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 3);

  const request = await prisma.instantChatRequest.create({
    data: {
      clientId,
      clientName: client.name || 'Anonymous',
      clientPhoto: client.profilePhoto || null,
      message: message || null,
      status: InstantChatRequestStatus.PENDING,
      expiresAt,
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          profilePhoto: true,
          phone: true,
        },
      },
    },
  });

  // Log audit action
  await auditService.logAction({
    action: AuditAction.INSTANT_CHAT_REQUEST_CREATE,
    resource: 'InstantChatRequest',
    resourceId: request.id,
    userId: clientId,
    details: { requestId: request.id, message },
  });

  // Notify admin
  notifyInstantChatRequestCreated(request);

  return request;
};

/**
 * Get all pending instant chat requests for online astrologers
 * @returns List of pending requests
 */
export const getPendingInstantChatRequests = async () => {
  const requests = await prisma.instantChatRequest.findMany({
    where: {
      status: InstantChatRequestStatus.PENDING,
      expiresAt: {
        gte: new Date(),
      },
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          profilePhoto: true,
          phone: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc', // First come, first served
    },
  });

  return requests;
};

/**
 * Accept an instant chat request
 * @param requestId - ID of the request
 * @param astrologerId - ID of the astrologer accepting
 * @returns Updated request with chat ID
 */
export const acceptInstantChatRequest = async (requestId: string, astrologerId: string) => {
  // Get the request
  const request = await prisma.instantChatRequest.findUnique({
    where: { id: requestId },
    include: {
      client: true,
    },
  });

  if (!request) {
    throw new Error('Request not found');
  }

  if (request.status !== InstantChatRequestStatus.PENDING) {
    throw new Error('Request is no longer available');
  }

  if (new Date() > request.expiresAt) {
    // Mark as expired
    await prisma.instantChatRequest.update({
      where: { id: requestId },
      data: { status: InstantChatRequestStatus.EXPIRED },
    });
    throw new Error('Request has expired');
  }

  // Check if astrologer is PROFESSIONAL - they cannot accept instant chat requests
  const astrologer = await prisma.astrologer.findUnique({
    where: { id: astrologerId },
    select: { category: true, name: true },
  });

  if (!astrologer) {
    throw new AppError(
      'Astrologer not found',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.ASTROLOGER_NOT_FOUND
    );
  }

  if (astrologer.category === AstrologerCategory.PROFESSIONAL) {
    throw new AppError(
      `${astrologer.name} is a Professional astrologer and only available through scheduled appointments. Please book an appointment to chat.`,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // Check if astrologer already has an active accepted request
  const activeRequest = await prisma.instantChatRequest.findFirst({
    where: {
      acceptedBy: astrologerId,
      status: InstantChatRequestStatus.ACCEPTED,
      // Only check requests accepted in last 5 minutes
      acceptedAt: {
        gte: new Date(Date.now() - 5 * 60 * 1000),
      },
    },
  });

  if (activeRequest) {
    throw new Error('You already have an active instant chat. Please complete it first.');
  }

  // Create or get existing chat between client and astrologer
  let chat = await prisma.chat.findUnique({
    where: {
      participant1Id_participant2Id: {
        participant1Id: request.clientId,
        participant2Id: astrologerId,
      },
    },
  });

  // If chat exists and is locked, unlock it
  if (chat && chat.isLocked) {
    chat = await prisma.chat.update({
      where: { id: chat.id },
      data: {
        isLocked: false,
        status: 'ACTIVE',
        endedBy: null,
        endedAt: null,
      },
    });
  }

  if (!chat) {
    // Check if client profile is completed before creating chat
    // Check actual required fields instead of just profileCompleted flag
    const clientProfile = await prisma.user.findUnique({
      where: { id: request.clientId },
      select: {
        name: true,
        dateOfBirth: true,
        timeOfBirth: true,
        placeOfBirth: true,
        profileCompleted: true,
      },
    });

    if (!clientProfile) {
      throw new Error('User not found');
    }

    // Check if all required fields are present (same logic as frontend)
    const missingFields: string[] = [];
    if (!clientProfile.name || clientProfile.name.trim() === '') {
      missingFields.push('Name');
    }
    if (!clientProfile.dateOfBirth) {
      missingFields.push('Date of Birth');
    }
    if (!clientProfile.timeOfBirth || clientProfile.timeOfBirth.trim() === '') {
      missingFields.push('Time of Birth');
    }
    if (!clientProfile.placeOfBirth || clientProfile.placeOfBirth.trim() === '') {
      missingFields.push('Place of Birth');
    }

    if (missingFields.length > 0) {
      throw new Error(
        `Please complete your profile before starting a chat. Missing: ${missingFields.join(', ')}`
      );
    }

    // Deduct coins if required for this astrologer category
    if (requiresCoinsForChat(astrologer.category)) {
      const { toSharedAstrologerCategory } = await import('../constants/coin.constants');
      await deductCoinsForChat({
        userId: request.clientId,
        astrologerCategory: toSharedAstrologerCategory(astrologer.category),
      });
    }

    // Create new chat (client=participant1, astrologer=participant2)
    chat = await prisma.chat.create({
      data: {
        participant1Id: request.clientId,
        participant2Id: astrologerId,
        participant1Type: 'CLIENT',
        participant2Type: 'ASTROLOGER',
        status: 'ACTIVE',
        isLocked: false,
      },
    });
  }

  // Update request
  const updatedRequest = await prisma.instantChatRequest.update({
    where: { id: requestId },
    data: {
      status: InstantChatRequestStatus.ACCEPTED,
      acceptedBy: astrologerId,
      chatId: chat.id,
      acceptedAt: new Date(),
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          profilePhoto: true,
          phone: true,
        },
      },
      acceptedAstrologer: {
        select: {
          id: true,
          name: true,
          profilePhoto: true,
        },
      },
    },
  });

  // Log audit action
  await auditService.logAction({
    action: AuditAction.INSTANT_CHAT_REQUEST_ACCEPT,
    resource: 'InstantChatRequest',
    resourceId: requestId,
    userId: request.clientId,
    astrologerId,
    details: { requestId, clientId: request.clientId, chatId: chat.id },
  });

  // Notify admin
  notifyInstantChatRequestAccepted(requestId, request.clientId, astrologerId, chat.id);

  return {
    request: updatedRequest,
    chatId: chat.id,
  };
};

/**
 * Cancel an instant chat request
 * @param requestId - ID of the request
 * @param clientId - ID of the client (for authorization)
 * @returns Updated request
 */
export const cancelInstantChatRequest = async (requestId: string, clientId: string) => {
  const request = await prisma.instantChatRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new Error('Request not found');
  }

  if (request.clientId !== clientId) {
    throw new Error('Unauthorized to cancel this request');
  }

  if (request.status !== InstantChatRequestStatus.PENDING) {
    throw new Error('Request cannot be cancelled');
  }

  const updatedRequest = await prisma.instantChatRequest.update({
    where: { id: requestId },
    data: { status: InstantChatRequestStatus.CANCELLED },
  });

  // Log audit action
  await auditService.logAction({
    action: AuditAction.INSTANT_CHAT_REQUEST_CANCEL,
    resource: 'InstantChatRequest',
    resourceId: requestId,
    userId: clientId,
    details: { requestId },
  });

  // Notify admin
  notifyInstantChatRequestCancelled(requestId, clientId);

  return updatedRequest;
};

/**
 * Expire old pending requests
 * Should be run periodically (e.g., every minute)
 */
export const expireOldRequests = async () => {
  const result = await prisma.instantChatRequest.updateMany({
    where: {
      status: InstantChatRequestStatus.PENDING,
      expiresAt: {
        lt: new Date(),
      },
    },
    data: {
      status: InstantChatRequestStatus.EXPIRED,
    },
  });

  return result.count;
};

/**
 * Get client's active instant chat request
 * @param clientId - ID of the client
 * @returns Active request or null
 */
export const getClientActiveRequest = async (clientId: string) => {
  const request = await prisma.instantChatRequest.findFirst({
    where: {
      clientId,
      status: InstantChatRequestStatus.PENDING,
      expiresAt: {
        gte: new Date(),
      },
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          profilePhoto: true,
        },
      },
    },
  });

  return request;
};

/**
 * Check if astrologer has accepted any request recently
 * @param astrologerId - ID of the astrologer
 * @returns Boolean indicating if astrologer is busy
 */
export const isAstrologerBusy = async (astrologerId: string) => {
  const recentAcceptedRequest = await prisma.instantChatRequest.findFirst({
    where: {
      acceptedBy: astrologerId,
      status: InstantChatRequestStatus.ACCEPTED,
      acceptedAt: {
        gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
      },
    },
  });

  return !!recentAcceptedRequest;
};
