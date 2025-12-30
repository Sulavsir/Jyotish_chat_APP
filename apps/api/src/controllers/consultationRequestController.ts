/**
 * Consultation Request Controller
 * HTTP handlers for consultation request operations
 */

import { Response, NextFunction } from 'express';
import { consultationRequestService } from '../services/consultationRequest.service';
import { sendSuccess } from '../utils';
import { AuthRequest } from '../types';
import { ConsultationType } from '@prisma/client';
import { HTTP_STATUS } from '../constants';
import { getSocketInstance } from '../utils/socket-instance';
import {
  broadcastNewConsultationRequest,
  broadcastConsultationRequestAccepted,
  broadcastConsultationRequestCancelled,
} from '../socket/consultationRequestHandlers';

export class ConsultationRequestController {
  /**
   * Create a new consultation request
   * POST /api/v1/consultation-requests
   */
  async createRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { type, description, preferredTime, duration } = req.body;

      // Validate type
      if (!type || !Object.values(ConsultationType).includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid consultation type',
        });
      }

      const request = await consultationRequestService.createRequest({
        clientId: userId,
        type,
        description,
        preferredTime: preferredTime ? new Date(preferredTime) : undefined,
        duration,
      });

      // Broadcast to all online astrologers via Socket.io
      try {
        const io = getSocketInstance();
        await broadcastNewConsultationRequest(io, request);
      } catch (socketError) {
        console.error('Error broadcasting consultation request:', socketError);
        // Don't fail the request if broadcasting fails
      }

      return sendSuccess(res, request, HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all pending consultation requests (for astrologers)
   * GET /api/v1/consultation-requests/pending
   */
  async getPendingRequests(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const requests = await consultationRequestService.getPendingRequests();
      return sendSuccess(res, requests);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get client's own consultation requests
   * GET /api/v1/consultation-requests/my-requests
   */
  async getMyRequests(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const requests = await consultationRequestService.getClientRequests(userId);
      return sendSuccess(res, requests);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single consultation request by ID
   * GET /api/v1/consultation-requests/:id
   */
  async getRequestById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const request = await consultationRequestService.getRequestById(id);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Consultation request not found',
        });
      }

      return sendSuccess(res, request);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Accept a consultation request (astrologer only)
   * POST /api/v1/consultation-requests/:id/accept
   */
  async acceptRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const { id } = req.params;

      // Only astrologers can accept requests
      if (userRole !== 'ASTROLOGER') {
        return res.status(403).json({
          success: false,
          message: 'Only astrologers can accept consultation requests',
        });
      }

      const result = await consultationRequestService.acceptRequest({
        requestId: id,
        astrologerId: userId,
      });

      // Broadcast acceptance to all astrologers and client
      try {
        const io = getSocketInstance();
        await broadcastConsultationRequestAccepted(io, result.request, userId);
      } catch (socketError) {
        console.error('Error broadcasting consultation request acceptance:', socketError);
      }

      return sendSuccess(res, result);
    } catch (error: any) {
      // Handle specific errors
      if (error.message.includes('already have an active consultation')) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message.includes('already been accepted')) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message.includes('expired')) {
        return res.status(410).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * Cancel a consultation request (client only)
   * POST /api/v1/consultation-requests/:id/cancel
   */
  async cancelRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const request = await consultationRequestService.cancelRequest(id, userId);

      // Broadcast cancellation to all astrologers
      try {
        const io = getSocketInstance();
        await broadcastConsultationRequestCancelled(io, id);
      } catch (socketError) {
        console.error('Error broadcasting consultation request cancellation:', socketError);
      }

      return sendSuccess(res, request);
    } catch (error: any) {
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message.includes('Can only cancel pending')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * Check if astrologer has active consultation
   * GET /api/v1/consultation-requests/check-active
   */
  async checkActiveConsultation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const hasActive = await consultationRequestService.hasActiveConsultation(userId);

      return sendSuccess(res, { hasActive });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get consultation request statistics (admin/debug)
   * GET /api/v1/consultation-requests/statistics
   */
  async getStatistics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await consultationRequestService.getStatistics();
      return sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

export const consultationRequestController = new ConsultationRequestController();
