/**
 * Client Chat History Controller
 * Astrologer-only: anonymous aggregated view of client's past conversations
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import { sendSuccess, sendError } from '../utils';
import * as chatService from '../services/chatService';
import { UserRole } from '@jyotish/shared';
import { prisma } from '@jyotish/database';
import { ACTIVE_CLIENT_USER_WHERE } from '../constants/user.constants';

/**
 * GET /api/v1/astrologer/client/chat-history
 * Query: clientId, cursor?, limit?
 * Returns anonymized messages from all of client's past chats. Cursor-based pagination.
 */
export async function getClientChatHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (req.user!.role !== UserRole.ASTROLOGER) {
      return sendError(res, 'Only astrologers can view client chat history', 403);
    }

    const astrologerId = req.user!.id;
    const query = req.query as unknown as {
      clientId: string;
      cursor?: string;
      limit?: number;
    };
    const { clientId, cursor, limit } = query;

    const client = await prisma.user.findFirst({
      where: { id: clientId, ...ACTIVE_CLIENT_USER_WHERE },
      select: { id: true, role: true },
    });
    if (!client || client.role !== UserRole.CLIENT) {
      return sendError(res, 'Client not found', 404);
    }

    const result = await chatService.getClientChatHistory(
      { clientId, cursor, limit: limit ?? 12 },
      astrologerId
    );

    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/astrologer/client/:clientId/has-chat-history
 * Returns { hasHistory: boolean } - whether client has previous conversations with other astrologers.
 */
export async function getClientHasChatHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (req.user!.role !== UserRole.ASTROLOGER) {
      return sendError(res, 'Only astrologers can check client chat history', 403);
    }

    const { clientId } = req.params;

    const client = await prisma.user.findFirst({
      where: { id: clientId, ...ACTIVE_CLIENT_USER_WHERE },
      select: { id: true, role: true },
    });
    if (!client || client.role !== UserRole.CLIENT) {
      return sendError(res, 'Client not found', 404);
    }

    const hasHistory = await chatService.clientHasChatHistory(clientId);
    return sendSuccess(res, { hasHistory });
  } catch (error) {
    next(error);
  }
}
