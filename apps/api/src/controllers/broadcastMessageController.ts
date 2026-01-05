/**
 * Broadcast Message Controller
 * Handles HTTP requests for "Everyone Jyotish" broadcast messaging
 */

import { Response } from 'express';
import { UserRole } from '@jyotish/shared';
import { AuthRequest } from '@/types';
import * as broadcastMessageService from '../services/broadcastMessage.service';
import { sendSuccess, sendError } from '../utils';
import { HTTP_STATUS } from '../constants';
import { getSocketInstance } from '../utils/socket-instance';

/**
 * POST /api/v1/broadcast-messages
 * Create a new broadcast message (client only)
 */
export async function createBroadcastMessage(req: AuthRequest, res: Response) {
  try {
    const { content, type, metadata } = req.body;
    const clientId = req.user!.id;

    // Validate user is a client
    if (req.user!.role !== 'CLIENT') {
      return sendError(res, 'Only clients can send broadcast messages', HTTP_STATUS.FORBIDDEN);
    }

    // Create broadcast message
    const message = await broadcastMessageService.createBroadcastMessage({
      clientId,
      content,
      type,
      metadata,
    });

    // Emit real-time event to all connected astrologers
    const io = getSocketInstance();
    if (io) {
      io.to('astrologers').emit('broadcast:newMessage', message);
    }

    return sendSuccess(res, message, HTTP_STATUS.CREATED);
  } catch (error: any) {
    console.error('Error creating broadcast message:', error);
    // Provide helpful message if table doesn't exist yet
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
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
 */
export async function getPendingMessages(req: AuthRequest, res: Response) {
  try {
    // Validate user is an astrologer
    if (req.user!.role !== 'ASTROLOGER') {
      return sendError(res, 'Only astrologers can view broadcast messages', HTTP_STATUS.FORBIDDEN);
    }

    const messages = await broadcastMessageService.getPendingBroadcastMessages();

    return sendSuccess(res, messages || []);
  } catch (error: any) {
    console.error('Error getting pending broadcast messages:', error);
    // Return empty array if table doesn't exist yet (before migration)
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
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
    if (req.user!.role !== 'ASTROLOGER') {
      return sendError(res, 'Only astrologers can view all broadcast messages', HTTP_STATUS.FORBIDDEN);
    }

    const messages = await broadcastMessageService.getAllBroadcastMessages();

    return sendSuccess(res, messages || []);
  } catch (error: any) {
    console.error('Error getting all broadcast messages:', error);
    // Return empty array if table doesn't exist yet (before migration)
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
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
      return sendError(res, 'Only clients can view their broadcast messages', HTTP_STATUS.FORBIDDEN);
    }

    const messages = await broadcastMessageService.getClientBroadcastMessages(clientId);

    return sendSuccess(res, messages || []);
  } catch (error: any) {
    console.error('Error getting client broadcast messages:', error);
    // Return empty array if table doesn't exist yet (before migration)
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
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
    if (req.user!.role !== 'ASTROLOGER') {
      return sendError(res, 'Only astrologers can accept broadcast messages', HTTP_STATUS.FORBIDDEN);
    }

    const result = await broadcastMessageService.acceptBroadcastMessage({
      messageId,
      astrologerId,
    });

    // Emit real-time events
    const io = getSocketInstance();
    if (io) {
      // Notify the client that their message was accepted
      io.to(`user:${result.message.clientId}`).emit('broadcast:yourMessageAccepted', {
        message: result.message,
        chat: result.chat,
        astrologer: result.message.acceptedAstrologer,
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
  } catch (error: any) {
    console.error('Error accepting broadcast message:', error);
    return sendError(res, error.message || 'Failed to accept broadcast message', HTTP_STATUS.BAD_REQUEST);
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

