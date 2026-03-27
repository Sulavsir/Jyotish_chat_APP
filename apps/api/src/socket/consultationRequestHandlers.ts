/**
 * Consultation Request Socket.io Handlers
 * Real-time broadcasting for ride-sharing style consultation requests
 */

import { Server, Socket } from 'socket.io';
import { consultationRequestService } from '../services/consultationRequest.service';
import { notificationService } from '../services/notification.service';
import { prisma, ConsultationRequest } from '@jyotish/database';
import { UserRole, NotificationType } from '@jyotish/shared';
import type { UserSummary } from '../types/common.types';
import {
  getOnlineAstrologerIds,
  getOnlineAstrologersCount,
} from './socketPresence';

export function consultationRequestHandlers(io: Server, socket: Socket) {
  const user = socket.data.user;

  if (user.role === UserRole.ASTROLOGER) {
    console.log(`🔮 Astrologer ${user.id} registered for consultation requests`);

    consultationRequestService.getPendingRequests().then((requests) => {
      socket.emit('consultationRequest:pending', requests);
    });
  }
}

/**
 * ConsultationRequest with client details included
 */
type ConsultationRequestWithClient = ConsultationRequest & {
  client: UserSummary;
};

/**
 * Broadcast a new consultation request to all online astrologers
 * Called from the API controller after creating a request
 */
export async function broadcastNewConsultationRequest(
  io: Server,
  request: ConsultationRequestWithClient
) {
  console.log(
    `📢 Broadcasting new consultation request ${request.id} to ${getOnlineAstrologersCount()} socket-connected astrologers`
  );

  io.to('astrologers').emit('consultationRequest:new', request);

  try {
    const astrologers = await prisma.user.findMany({
      where: {
        role: UserRole.ASTROLOGER,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    const notificationPromises = astrologers.map((astrologer) =>
      notificationService.createNotification({
        userId: astrologer.id,
        title: 'New Consultation Request',
        message: `${request.client?.name || 'A client'} is requesting a ${request.type.toLowerCase()} consultation`,
        type: NotificationType.CONSULTATION_BOOKING,
        metadata: {
          requestId: request.id,
          clientId: request.clientId,
          type: request.type,
        },
        groupKey: `consultation_request_${request.id}`,
      })
    );

    await Promise.all(notificationPromises);
  } catch (error) {
    console.error('Error creating notifications for consultation request:', error);
  }
}

/**
 * Broadcast when a consultation request is accepted
 * Removes the request from all other astrologers' lists
 */
export async function broadcastConsultationRequestAccepted(
  io: Server,
  request: ConsultationRequestWithClient & {
    acceptedAstrologer?: { id: string; name: string; phone?: string | null; email?: string | null; profilePhoto?: string | null } | null;
  },
  astrologerId: string
) {
  console.log(`✅ Consultation request ${request.id} accepted by astrologer ${astrologerId}`);

  const astrologerIds = getOnlineAstrologerIds();
  for (const astrId of astrologerIds) {
    if (astrId !== astrologerId) {
      io.to(`astrologer:${astrId}`).emit('consultationRequest:removed', { requestId: request.id });
    } else {
      io.to(`astrologer:${astrologerId}`).emit('consultationRequest:accepted', request);
    }
  }

  io.to(`user:${request.clientId}`).emit('consultationRequest:accepted', {
    requestId: request.id,
    astrologer: request.acceptedAstrologer,
  });

  await notificationService.createNotification({
    userId: request.clientId,
    title: 'Consultation Request Accepted',
    message: `${request.acceptedAstrologer?.name || 'An astrologer'} has accepted your consultation request`,
    type: NotificationType.CONSULTATION_BOOKING,
    metadata: {
      requestId: request.id,
      astrologerId,
    },
  });
}

/**
 * Broadcast when a consultation request is cancelled
 */
export async function broadcastConsultationRequestCancelled(io: Server, requestId: string) {
  console.log(`❌ Consultation request ${requestId} cancelled`);

  io.to('astrologers').emit('consultationRequest:removed', { requestId });
}

/**
 * Broadcast when a consultation request expires
 */
export async function broadcastConsultationRequestExpired(io: Server, requestId: string) {
  console.log(`⏰ Consultation request ${requestId} expired`);

  io.to('astrologers').emit('consultationRequest:removed', { requestId });
}

export { getOnlineAstrologerIds, getOnlineAstrologersCount } from './socketPresence';
