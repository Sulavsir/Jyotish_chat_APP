/**
 * Instant Chat Request Controller
 * Handles API endpoints for instant chat requests
 */

import { Response, NextFunction } from 'express';
import * as instantChatService from '../services/instantChat.service';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils';
import { HTTP_STATUS } from '../constants';

/**
 * POST /api/v1/instant-chat/request
 * Create an instant chat request
 */
export const createRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { message } = req.body;

    const request = await instantChatService.createInstantChatRequest(userId, message);

    sendSuccess(res, request, HTTP_STATUS.CREATED);
  } catch (error: any) {
    sendError(
      res,
      error.message || 'Failed to create instant chat request',
      HTTP_STATUS.BAD_REQUEST
    );
  }
};

/**
 * GET /api/v1/instant-chat/pending
 * Get all pending instant chat requests (for astrologers)
 */
export const getPendingRequests = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const requests = await instantChatService.getPendingInstantChatRequests();
    sendSuccess(res, requests);
  } catch (error: any) {
    sendError(
      res,
      error.message || 'Failed to fetch pending requests',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * POST /api/v1/instant-chat/accept/:requestId
 * Accept an instant chat request
 */
export const acceptRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { requestId } = req.params;

    const result = await instantChatService.acceptInstantChatRequest(requestId, userId);

    sendSuccess(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to accept request', HTTP_STATUS.BAD_REQUEST);
  }
};

/**
 * DELETE /api/v1/instant-chat/cancel/:requestId
 * Cancel an instant chat request
 */
export const cancelRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { requestId } = req.params;

    const request = await instantChatService.cancelInstantChatRequest(requestId, userId);

    sendSuccess(res, request);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to cancel request', HTTP_STATUS.BAD_REQUEST);
  }
};

/**
 * GET /api/v1/instant-chat/my-request
 * Get client's active instant chat request
 */
export const getMyActiveRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const request = await instantChatService.getClientActiveRequest(userId);

    sendSuccess(res, request);
  } catch (error: any) {
    sendError(
      res,
      error.message || 'Failed to fetch active request',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * GET /api/v1/instant-chat/status
 * Check if astrologer is busy
 */
export const checkAstrologerStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const isBusy = await instantChatService.isAstrologerBusy(userId);

    sendSuccess(res, { isBusy });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to check status', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};
