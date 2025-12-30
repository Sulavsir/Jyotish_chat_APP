/**
 * Consultation Request Socket.io Handlers
 * Real-time broadcasting for ride-sharing style consultation requests
 */

import { Server, Socket } from 'socket.io';
import { consultationRequestService } from '../services/consultationRequest.service';
import { notificationService } from '../services/notification.service';
import { prisma, ConsultationRequest } from '@jyotish/database';
import { NotificationType } from '@jyotish/shared';

// Store online astrologers separately for efficient broadcasting
const onlineAstrologers = new Map<string, string>(); // astrologerId -> socketId

export function consultationRequestHandlers(io: Server, socket: Socket) {
  const user = socket.data.user;

  // Register astrologer as online
  if (user.role === 'ASTROLOGER') {
    onlineAstrologers.set(user.id, socket.id);
    console.log(`🔮 Astrologer ${user.id} is now online and can receive requests`);

    // Send current pending requests to newly connected astrologer
    consultationRequestService.getPendingRequests().then((requests) => {
      socket.emit('consultationRequest:pending', requests);
    });
  }

  // When astrologer disconnects, remove from online list
  socket.on('disconnect', () => {
    if (user.role === 'ASTROLOGER') {
      onlineAstrologers.delete(user.id);
      console.log(`🔮 Astrologer ${user.id} is now offline`);
    }
  });
}

/**
 * ConsultationRequest with client details included
 */
type ConsultationRequestWithClient = ConsultationRequest & {
  client: {
    id: string;
    name: string | null;
    phone: string;
    profilePhoto: string | null;
    email: string | null;
  };
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
    `📢 Broadcasting new consultation request ${request.id} to ${onlineAstrologers.size} online astrologers`
  );

  // Broadcast to all online astrologers
  onlineAstrologers.forEach((socketId, astrologerId) => {
    io.to(socketId).emit('consultationRequest:new', request);
  });

  // Also create notifications for all astrologers (even offline ones)
  try {
    const astrologers = await prisma.user.findMany({
      where: {
        role: 'ASTROLOGER',
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    // Create grouped notifications for each astrologer
    const notificationPromises = astrologers.map((astrologer) =>
      notificationService.createNotification({
        userId: astrologer.id,
        title: 'New Consultation Request',
        message: `${request.client?.name || 'A client'} is requesting a ${request.type.toLowerCase()} consultation`,
        type: 'CONSULTATION_BOOKING' as any,
        metadata: {
          requestId: request.id,
          clientId: request.clientId,
          type: request.type,
        },
        groupKey: `consultation_request_${request.id}`, // Same groupKey for all astrologers
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
  request: any,
  astrologerId: string
) {
  console.log(`✅ Consultation request ${request.id} accepted by astrologer ${astrologerId}`);

  // Remove from all astrologers except the one who accepted
  onlineAstrologers.forEach((socketId, astrId) => {
    if (astrId !== astrologerId) {
      io.to(socketId).emit('consultationRequest:removed', { requestId: request.id });
    } else {
      // Send confirmation to accepting astrologer
      io.to(socketId).emit('consultationRequest:accepted', request);
    }
  });

  // Notify the client
  const clientSocketId = await getSocketIdByUserId(request.clientId);
  if (clientSocketId) {
    io.to(clientSocketId).emit('consultationRequest:accepted', {
      requestId: request.id,
      astrologer: request.acceptedAstrologer,
    });

    // Also send notification
    await notificationService.createNotification({
      userId: request.clientId,
      title: 'Consultation Request Accepted',
      message: `${request.acceptedAstrologer?.name || 'An astrologer'} has accepted your consultation request`,
      type: 'CONSULTATION_BOOKING' as any,
      metadata: {
        requestId: request.id,
        astrologerId,
      },
    });
  }
}

/**
 * Broadcast when a consultation request is cancelled
 */
export async function broadcastConsultationRequestCancelled(io: Server, requestId: string) {
  console.log(`❌ Consultation request ${requestId} cancelled`);

  // Remove from all astrologers' lists
  onlineAstrologers.forEach((socketId) => {
    io.to(socketId).emit('consultationRequest:removed', { requestId });
  });
}

/**
 * Broadcast when a consultation request expires
 */
export async function broadcastConsultationRequestExpired(io: Server, requestId: string) {
  console.log(`⏰ Consultation request ${requestId} expired`);

  // Remove from all astrologers' lists
  onlineAstrologers.forEach((socketId) => {
    io.to(socketId).emit('consultationRequest:removed', { requestId });
  });
}

/**
 * Helper function to get socket ID by user ID
 */
async function getSocketIdByUserId(userId: string): Promise<string | null> {
  // Import onlineUsers from the main socket index
  const { onlineUsers } = await import('./index');
  return onlineUsers.get(userId) || null;
}

/**
 * Get count of online astrologers
 */
export function getOnlineAstrologersCount(): number {
  return onlineAstrologers.size;
}

/**
 * Get list of online astrologer IDs
 */
export function getOnlineAstrologerIds(): string[] {
  return Array.from(onlineAstrologers.keys());
}

export { onlineAstrologers };
