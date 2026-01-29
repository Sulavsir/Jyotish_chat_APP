/**
 * Broadcast Message Controller
 * Handles HTTP requests for "Everyone Jyotish" broadcast messaging
 */

import { Response } from 'express';
import { UserRole } from '@jyotish/shared';
import { AuthRequest } from '@/types';
import { broadcastMessageService } from '../services';
import { sendSuccess, sendError } from '../utils';
import { HTTP_STATUS } from '../constants';
import { getSocketInstance } from '../utils/socket-instance';

type BroadcastMessageControllerError = Error & {
  code?: string;
  message?: string;
  statusCode?: number;
};

/**
 * POST /api/v1/broadcast-messages
 * Create a new broadcast message (client only)
 */
export async function createBroadcastMessage(req: AuthRequest, res: Response) {
  try {
    const { content, type, metadata } = req.body;
    const clientId = req.user!.id;

    // Validate user is a client
    if (req.user!.role !== UserRole.CLIENT) {
      return sendError(res, 'Only clients can send broadcast messages', HTTP_STATUS.FORBIDDEN);
    }

    // Create broadcast message
    const message = await broadcastMessageService.createBroadcastMessage({
      clientId,
      content,
      type,
      metadata,
    });

    // Emit real-time event to eligible astrologers only (excluding PREMIUM)
    // Note: The socket handler already filters this, but we keep this for consistency
    const io = getSocketInstance();
    if (io) {
      // The socket handler will filter out PREMIUM astrologers
      io.to('astrologers').emit('broadcast:newMessage', message);
    }

    return sendSuccess(res, message, HTTP_STATUS.CREATED);
  } catch (error: unknown) {
    const err = error as BroadcastMessageControllerError;
    console.error('Error creating broadcast message:', error);
    // Provide helpful message if table doesn't exist yet
    if (err?.code === 'P2021' || err?.message?.includes('does not exist')) {
      return sendError(
        res,
        'Database not ready. Please run: cd packages/database && pnpm exec prisma db push',
        HTTP_STATUS.SERVICE_UNAVAILABLE
      );
    }
    return sendError(res, 'Failed to send broadcast message', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * GET /api/v1/broadcast-messages/pending
 * Get all pending broadcast messages (astrologer only)
 * Automatically filters out messages dismissed by the requesting astrologer
 */
export async function getPendingMessages(req: AuthRequest, res: Response) {
  try {
    // Validate user is an astrologer
    if (req.user!.role !== UserRole.ASTROLOGER) {
      return sendError(res, 'Only astrologers can view broadcast messages', HTTP_STATUS.FORBIDDEN);
    }

    const astrologerId = req.user!.id;
    const messages = await broadcastMessageService.getPendingBroadcastMessages(astrologerId);

    return sendSuccess(res, messages || []);
  } catch (error: unknown) {
    const err = error as BroadcastMessageControllerError;
    console.error('Error getting pending broadcast messages:', error);
    // Return empty array if table doesn't exist yet (before migration)
    if (err?.code === 'P2021' || err?.message?.includes('does not exist')) {
      return sendSuccess(res, []);
    }
    return sendError(
      res,
      'Failed to retrieve broadcast messages',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * GET /api/v1/broadcast-messages/all
 * Get all broadcast messages including accepted ones (astrologer only)
 */
export async function getAllMessages(req: AuthRequest, res: Response) {
  try {
    // Validate user is an astrologer
    if (req.user!.role !== UserRole.ASTROLOGER) {
      return sendError(
        res,
        'Only astrologers can view all broadcast messages',
        HTTP_STATUS.FORBIDDEN
      );
    }

    const astrologerId = req.user!.id;
    const messages = await broadcastMessageService.getAllBroadcastMessages(astrologerId);

    return sendSuccess(res, messages || []);
  } catch (error: unknown) {
    const err = error as BroadcastMessageControllerError;
    console.error('Error getting all broadcast messages:', error);
    // Return empty array if table doesn't exist yet (before migration)
    if (err?.code === 'P2021' || err?.message?.includes('does not exist')) {
      return sendSuccess(res, []);
    }
    return sendError(
      res,
      'Failed to retrieve all broadcast messages',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * GET /api/v1/broadcast-messages/my-messages
 * Get broadcast messages for current client
 */
export async function getMyMessages(req: AuthRequest, res: Response) {
  try {
    const clientId = req.user!.id;

    // Validate user is a client
    if (req.user!.role !== 'CLIENT') {
      return sendError(
        res,
        'Only clients can view their broadcast messages',
        HTTP_STATUS.FORBIDDEN
      );
    }

    const messages = await broadcastMessageService.getClientBroadcastMessages(clientId);

    return sendSuccess(res, messages || []);
  } catch (error: unknown) {
    const err = error as BroadcastMessageControllerError;
    console.error('Error getting client broadcast messages:', error);
    // Return empty array if table doesn't exist yet (before migration)
    if (err?.code === 'P2021' || err?.message?.includes('does not exist')) {
      return sendSuccess(res, []);
    }
    return sendError(
      res,
      'Failed to retrieve your broadcast messages',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * POST /api/v1/broadcast-messages/:messageId/accept
 * Accept a broadcast message and create a chat (astrologer only)
 */
export async function acceptMessage(req: AuthRequest, res: Response) {
  try {
    const { messageId } = req.params;
    const astrologerId = req.user!.id;

    // Validate user is an astrologer
    if (req.user!.role !== UserRole.ASTROLOGER) {
      return sendError(
        res,
        'Only astrologers can accept broadcast messages',
        HTTP_STATUS.FORBIDDEN
      );
    }

    const result = await broadcastMessageService.acceptBroadcastMessage({
      messageId,
      astrologerId,
    });

    // Emit real-time events
    const io = getSocketInstance();
    if (io) {
      // Notify the client that their message was accepted (with initial messages)
      io.to(`user:${result.message.clientId}`).emit('broadcast:yourMessageAccepted', {
        message: result.message,
        chat: result.chat,
        astrologer: result.message.acceptedAstrologer,
        initialMessages: result.initialMessages, // Include the auto-generated messages
      });

      // Notify all astrologers (including acceptor) about the acceptance
      io.to('astrologers').emit('broadcast:messageAcceptedByAstrologer', {
        messageId: result.message.id,
        acceptedBy: result.message.acceptedAstrologer,
        acceptedAt: result.message.acceptedAt,
        clientName: result.message.client?.name || result.message.client?.phone,
      });
    }

    return sendSuccess(res, result);
  } catch (error: unknown) {
    const err = error as BroadcastMessageControllerError;
    console.error('Error accepting broadcast message:', error);
    return sendError(
      res,
      err?.message || 'Failed to accept broadcast message',
      HTTP_STATUS.BAD_REQUEST
    );
  }
}

/**
 * POST /api/v1/broadcast-messages/:messageId/cancel
 * Cancel a pending broadcast message (client only). Refunds coin and notifies astrologers.
 */
export async function cancelBroadcastMessage(req: AuthRequest, res: Response) {
  try {
    const { messageId } = req.params;
    const clientId = req.user!.id;

    if (req.user!.role !== UserRole.CLIENT) {
      return sendError(
        res,
        'Only clients can cancel their broadcast messages',
        HTTP_STATUS.FORBIDDEN
      );
    }

    const message = await broadcastMessageService.cancelBroadcastMessage(messageId, clientId);

    const io = getSocketInstance();
    if (io) {
      io.to('astrologers').emit('broadcast:messageCancelled', {
        messageId: message.id,
        cancelledAt: message.updatedAt,
      });
    }

    return sendSuccess(res, {
      success: true,
      message,
      messageId: message.id,
    });
  } catch (error: unknown) {
    const err = error as BroadcastMessageControllerError;
    console.error('Error cancelling broadcast message:', error);
    const status =
      err?.statusCode ??
      (err?.code === 'NOT_FOUND' ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.BAD_REQUEST);
    return sendError(res, err?.message || 'Failed to cancel broadcast message', status);
  }
}

/**
 * POST /api/v1/broadcast-messages/:messageId/dismiss
 * Dismiss/Reject a broadcast message (astrologer only)
 * The message won't be shown to this astrologer again
 */
export async function dismissBroadcastMessage(req: AuthRequest, res: Response) {
  try {
    const { messageId } = req.params;
    const astrologerId = req.user!.id;

    // Validate user is an astrologer
    if (req.user!.role !== UserRole.ASTROLOGER) {
      return sendError(
        res,
        'Only astrologers can dismiss broadcast messages',
        HTTP_STATUS.FORBIDDEN
      );
    }

    const result = await broadcastMessageService.dismissBroadcastMessage(messageId, astrologerId);

    // Emit real-time event to notify other systems if needed
    const io = getSocketInstance();
    if (io) {
      // Notify the astrologer's client that the message was dismissed (for UI updates)
      io.to(`user:${astrologerId}`).emit('broadcast:messageDismissed', {
        messageId,
        dismissedAt: result.dismissedAt,
      });
    }

    return sendSuccess(res, {
      success: true,
      messageId,
      dismissedAt: result.dismissedAt,
    });
  } catch (error: unknown) {
    const err = error as BroadcastMessageControllerError;
    console.error('Error dismissing broadcast message:', error);
    return sendError(
      res,
      err?.message || 'Failed to dismiss broadcast message',
      HTTP_STATUS.BAD_REQUEST
    );
  }
}

/**
 * GET /api/v1/broadcast-messages/:messageId
 * Get a specific broadcast message
 */
export async function getBroadcastMessage(req: AuthRequest, res: Response) {
  try {
    const { messageId } = req.params;

    const message = await broadcastMessageService.getBroadcastMessageById(messageId);

    if (!message) {
      return sendError(res, 'Broadcast message not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check permissions - clients can only see their own, astrologers can see all
    if (req.user!.role === UserRole.CLIENT && message.clientId !== req.user!.id) {
      return sendError(res, 'Access denied', HTTP_STATUS.FORBIDDEN);
    }

    return sendSuccess(res, message);
  } catch (error) {
    console.error('Error getting broadcast message:', error);
    return sendError(
      res,
      'Failed to retrieve broadcast message',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}
