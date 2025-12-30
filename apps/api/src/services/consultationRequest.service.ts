/**
 * Consultation Request Service
 * Handles ride-sharing style consultation requests where clients request
 * and active astrologers can accept
 */

import { prisma } from '@jyotish/database';
import { ConsultationRequestStatus, ConsultationType } from '@prisma/client';

export interface CreateConsultationRequestDto {
  clientId: string;
  type: ConsultationType;
  description?: string;
  preferredTime?: Date;
  duration?: number;
}

export interface AcceptConsultationRequestDto {
  requestId: string;
  astrologerId: string;
}

class ConsultationRequestService {
  /**
   * Create a new consultation request
   * This broadcasts to all active astrologers
   */
  async createRequest(data: CreateConsultationRequestDto) {
    // Set expiration time (15 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const request = await prisma.consultationRequest.create({
      data: {
        clientId: data.clientId,
        type: data.type,
        description: data.description,
        preferredTime: data.preferredTime,
        duration: data.duration || 30,
        status: ConsultationRequestStatus.PENDING,
        expiresAt,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            profilePhoto: true,
            email: true,
          },
        },
      },
    });

    return request;
  }

  /**
   * Get all pending consultation requests
   * Only shows non-expired, pending requests
   */
  async getPendingRequests() {
    const now = new Date();

    // First, auto-expire old requests
    await this.autoExpireRequests();

    // Get all pending requests that haven't expired
    const requests = await prisma.consultationRequest.findMany({
      where: {
        status: ConsultationRequestStatus.PENDING,
        expiresAt: {
          gt: now,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            profilePhoto: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return requests;
  }

  /**
   * Get consultation requests for a specific client
   */
  async getClientRequests(clientId: string) {
    const requests = await prisma.consultationRequest.findMany({
      where: {
        clientId,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            profilePhoto: true,
          },
        },
        acceptedAstrologer: {
          select: {
            id: true,
            name: true,
            phone: true,
            profilePhoto: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    return requests;
  }

  /**
   * Get a single consultation request by ID
   */
  async getRequestById(requestId: string) {
    const request = await prisma.consultationRequest.findUnique({
      where: { id: requestId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            profilePhoto: true,
            email: true,
          },
        },
        acceptedAstrologer: {
          select: {
            id: true,
            name: true,
            phone: true,
            profilePhoto: true,
          },
        },
      },
    });

    return request;
  }

  /**
   * Check if astrologer has any active consultation
   * Prevents accepting multiple requests
   */
  async hasActiveConsultation(astrologerId: string): Promise<boolean> {
    const activeConsultation = await prisma.consultation.findFirst({
      where: {
        astrologerId,
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'],
        },
      },
    });

    // Also check if they have any accepted but not completed consultation requests
    const acceptedRequest = await prisma.consultationRequest.findFirst({
      where: {
        acceptedBy: astrologerId,
        status: {
          in: [ConsultationRequestStatus.PENDING, ConsultationRequestStatus.ACCEPTED],
        },
      },
    });

    return !!(activeConsultation || acceptedRequest);
  }

  /**
   * Accept a consultation request
   * Only if astrologer has no active consultations
   */
  async acceptRequest(data: AcceptConsultationRequestDto) {
    const { requestId, astrologerId } = data;

    // Check if astrologer has active consultation
    const hasActive = await this.hasActiveConsultation(astrologerId);
    if (hasActive) {
      throw new Error('You already have an active consultation. Please complete it before accepting a new request.');
    }

    // Get the request
    const request = await prisma.consultationRequest.findUnique({
      where: { id: requestId },
      include: { client: true },
    });

    if (!request) {
      throw new Error('Consultation request not found');
    }

    if (request.status !== ConsultationRequestStatus.PENDING) {
      throw new Error('This request has already been accepted or expired');
    }

    // Check if expired
    if (request.expiresAt && new Date() > request.expiresAt) {
      await prisma.consultationRequest.update({
        where: { id: requestId },
        data: { status: ConsultationRequestStatus.EXPIRED },
      });
      throw new Error('This request has expired');
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Update request status
      const updatedRequest = await tx.consultationRequest.update({
        where: { id: requestId },
        data: {
          status: ConsultationRequestStatus.ACCEPTED,
          acceptedBy: astrologerId,
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              phone: true,
              profilePhoto: true,
              email: true,
            },
          },
          acceptedAstrologer: {
            select: {
              id: true,
              name: true,
              phone: true,
              profilePhoto: true,
            },
          },
        },
      });

      // Create a consultation
      const scheduledAt = request.preferredTime || new Date();
      const consultation = await tx.consultation.create({
        data: {
          clientId: request.clientId,
          astrologerId,
          scheduledAt,
          duration: request.duration,
          type: request.type,
          amount: 0, // Will be calculated based on astrologer rates
          notes: request.description,
          status: 'CONFIRMED',
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              phone: true,
              profilePhoto: true,
            },
          },
          astrologer: {
            select: {
              id: true,
              name: true,
              phone: true,
              profilePhoto: true,
            },
          },
        },
      });

      // Update request with consultation ID and mark as completed
      await tx.consultationRequest.update({
        where: { id: requestId },
        data: {
          consultationId: consultation.id,
          status: ConsultationRequestStatus.COMPLETED,
        },
      });

      return { request: updatedRequest, consultation };
    });

    return result;
  }

  /**
   * Cancel a consultation request (by client)
   */
  async cancelRequest(requestId: string, clientId: string) {
    const request = await prisma.consultationRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error('Consultation request not found');
    }

    if (request.clientId !== clientId) {
      throw new Error('Unauthorized to cancel this request');
    }

    if (request.status !== ConsultationRequestStatus.PENDING) {
      throw new Error('Can only cancel pending requests');
    }

    const updatedRequest = await prisma.consultationRequest.update({
      where: { id: requestId },
      data: {
        status: ConsultationRequestStatus.CANCELLED,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            profilePhoto: true,
          },
        },
      },
    });

    return updatedRequest;
  }

  /**
   * Auto-expire old consultation requests
   * Called periodically or before fetching requests
   */
  async autoExpireRequests() {
    const now = new Date();

    const result = await prisma.consultationRequest.updateMany({
      where: {
        status: ConsultationRequestStatus.PENDING,
        expiresAt: {
          lte: now,
        },
      },
      data: {
        status: ConsultationRequestStatus.EXPIRED,
      },
    });

    return result.count;
  }

  /**
   * Get statistics for consultation requests
   */
  async getStatistics() {
    const [pending, accepted, completed, expired, cancelled] = await Promise.all([
      prisma.consultationRequest.count({
        where: { status: ConsultationRequestStatus.PENDING },
      }),
      prisma.consultationRequest.count({
        where: { status: ConsultationRequestStatus.ACCEPTED },
      }),
      prisma.consultationRequest.count({
        where: { status: ConsultationRequestStatus.COMPLETED },
      }),
      prisma.consultationRequest.count({
        where: { status: ConsultationRequestStatus.EXPIRED },
      }),
      prisma.consultationRequest.count({
        where: { status: ConsultationRequestStatus.CANCELLED },
      }),
    ]);

    return {
      pending,
      accepted,
      completed,
      expired,
      cancelled,
      total: pending + accepted + completed + expired + cancelled,
    };
  }
}

export const consultationRequestService = new ConsultationRequestService();

