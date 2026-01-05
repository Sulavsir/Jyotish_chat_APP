/**
 * Admin Monitoring Utility
 * Centralized utility to emit real-time events to admin panel for monitoring
 */

import { Server } from 'socket.io';

let ioInstance: Server | null = null;

/**
 * Initialize the admin monitor with Socket.IO instance
 */
export function initializeAdminMonitor(io: Server) {
  ioInstance = io;
  console.log('✅ Admin monitor initialized');
}

/**
 * Get the Socket.IO instance
 */
export function getAdminMonitor(): Server {
  if (!ioInstance) {
    throw new Error('Admin monitor not initialized. Call initializeAdminMonitor first.');
  }
  return ioInstance;
}

/**
 * Notify admins about a new consultation request
 */
export function notifyConsultationRequestCreated(request: any) {
  if (!ioInstance) return;

  ioInstance.to('admin').emit('consultation:new', {
    id: request.id,
    clientId: request.clientId,
    clientName: request.client?.name,
    type: request.type,
    status: request.status,
    createdAt: request.createdAt,
    expiresAt: request.expiresAt,
  });

  console.log(`📢 Admin notified: Consultation request ${request.id} created`);
}

/**
 * Notify admins about an accepted consultation request
 */
export function notifyConsultationRequestAccepted(
  request: any,
  astrologerId: string,
  astrologerName: string
) {
  if (!ioInstance) return;

  ioInstance.to('admin').emit('consultation:update', {
    id: request.id,
    clientId: request.clientId,
    astrologerId,
    astrologerName,
    status: 'ACCEPTED',
    acceptedAt: new Date(),
  });

  console.log(
    `📢 Admin notified: Consultation request ${request.id} accepted by ${astrologerName}`
  );
}

/**
 * Notify admins about a cancelled consultation request
 */
export function notifyConsultationRequestCancelled(requestId: string, clientId: string) {
  if (!ioInstance) return;

  ioInstance.to('admin').emit('consultation:update', {
    id: requestId,
    clientId,
    status: 'CANCELLED',
    cancelledAt: new Date(),
  });

  console.log(`📢 Admin notified: Consultation request ${requestId} cancelled`);
}

/**
 * Notify admins about a new instant chat request
 */
export function notifyInstantChatRequestCreated(request: any) {
  if (!ioInstance) return;

  ioInstance.to('admin').emit('instantChat:new', {
    id: request.id,
    clientId: request.clientId,
    clientName: request.clientName,
    status: request.status,
    createdAt: request.createdAt,
    expiresAt: request.expiresAt,
  });

  console.log(`📢 Admin notified: Instant chat request ${request.id} created`);
}

/**
 * Notify admins about an accepted instant chat request
 */
export function notifyInstantChatRequestAccepted(
  requestId: string,
  clientId: string,
  astrologerId: string,
  chatId: string
) {
  if (!ioInstance) return;

  ioInstance.to('admin').emit('instantChat:update', {
    id: requestId,
    clientId,
    astrologerId,
    chatId,
    status: 'ACCEPTED',
    acceptedAt: new Date(),
  });

  console.log(
    `📢 Admin notified: Instant chat request ${requestId} accepted by astrologer ${astrologerId}`
  );
}

/**
 * Notify admins about a cancelled instant chat request
 */
export function notifyInstantChatRequestCancelled(requestId: string, clientId: string) {
  if (!ioInstance) return;

  ioInstance.to('admin').emit('instantChat:update', {
    id: requestId,
    clientId,
    status: 'CANCELLED',
    cancelledAt: new Date(),
  });

  console.log(`📢 Admin notified: Instant chat request ${requestId} cancelled`);
}

/**
 * Notify admins about a new broadcast message
 */
export function notifyBroadcastMessageSent(message: any) {
  if (!ioInstance) return;

  ioInstance.to('admin').emit('broadcast:new', {
    id: message.id,
    clientId: message.clientId,
    clientName: message.client?.name,
    content: message.content,
    type: message.type,
    status: message.status,
    createdAt: message.createdAt,
  });

  // Also emit to chat audit
  ioInstance.to('admin').emit('chatAudit:new', {
    id: message.id,
    type: 'BROADCAST_MESSAGE',
    action: message.status,
    status: message.status,
    client: message.client,
    astrologer: null,
    content: message.content,
    messageType: message.type,
    metadata: message.metadata,
    createdAt: message.createdAt,
    acceptedAt: null,
  });

  console.log(`📢 Admin notified: Broadcast message ${message.id} sent`);
}

/**
 * Notify admins about an accepted broadcast message
 */
export function notifyBroadcastMessageAccepted(
  messageId: string,
  clientId: string,
  astrologerId: string,
  chatId: string
) {
  if (!ioInstance) return;

  ioInstance.to('admin').emit('broadcast:update', {
    id: messageId,
    clientId,
    astrologerId,
    chatId,
    status: 'ACCEPTED',
    acceptedAt: new Date(),
  });

  // Also emit to chat audit
  ioInstance.to('admin').emit('chatAudit:update', {
    id: messageId,
    status: 'ACCEPTED',
    astrologerId,
    chatId,
    acceptedAt: new Date(),
  });

  console.log(
    `📢 Admin notified: Broadcast message ${messageId} accepted by astrologer ${astrologerId}`
  );
}

/**
 * Notify admins about an expired broadcast message
 */
export function notifyBroadcastMessageExpired(messageId: string) {
  if (!ioInstance) return;
  
  ioInstance.to('admin').emit('broadcast:update', {
    id: messageId,
    status: 'EXPIRED',
    expiredAt: new Date(),
  });
  
  console.log(`📢 Admin notified: Broadcast message ${messageId} expired`);
}

/**
 * Notify admins about a chat ending (unified for all chat types)
 */
export function notifyChatEnded(
  requestId: string,
  chatId: string,
  endedBy: string,
  requestType: 'BROADCAST_MESSAGE' | 'INSTANT_CHAT_REQUEST' | 'DIRECT_CHAT'
) {
  if (!ioInstance) return;
  
  ioInstance.to('admin').emit('chatAudit:chatEnded', {
    id: requestId,
    chatId,
    requestType,
    chatStatus: 'ENDED',
    chatEndedBy: endedBy,
    chatEndedAt: new Date().toISOString(),
  });
  
  console.log(`📢 Admin notified: Chat ${chatId} ended for ${requestType} ${requestId}`);
}

/**
 * @deprecated Use notifyChatEnded instead
 */
export function notifyBroadcastMessageEnded(messageId: string, chatId: string, endedBy: string) {
  notifyChatEnded(messageId, chatId, endedBy, 'BROADCAST_MESSAGE');
}

/**
 * Notify admins about general activity between client and astrologer
 */
export function notifyAdminActivity(activity: {
  type: string;
  clientId: string;
  astrologerId?: string;
  details: string;
  metadata?: any;
}) {
  if (!ioInstance) return;

  ioInstance.to('admin').emit('activity:new', {
    ...activity,
    timestamp: new Date(),
  });

  console.log(`📢 Admin notified: ${activity.type} - ${activity.details}`);
}
