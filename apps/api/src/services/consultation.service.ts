/**
 * Consultation Service - Handle consultation business logic
 */

import { prisma } from '@jyotish/database';
import { UserRole, ConsultationStatus } from '@jyotish/shared';
import type {
  BookConsultationData,
  UpdateConsultationData,
  ConsultationUserRole,
  ConsultationWithRelations,
} from '../types';

export class ConsultationService {
  /**
   * Get all consultations for a user
   */
  async getConsultationsByUserId(
    userId: string,
    role: ConsultationUserRole = UserRole.CLIENT
  ): Promise<ConsultationWithRelations[]> {
    const consultations = await prisma.consultation.findMany({
      where:
        role === UserRole.CLIENT
          ? { clientId: userId }
          : role === UserRole.ASTROLOGER
            ? { astrologerId: userId }
            : {
                OR: [{ clientId: userId }, { astrologerId: userId }],
              },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            profilePhoto: true,
          },
        },
        astrologer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            profilePhoto: true,
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            transactionId: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    });

    return consultations;
  }

  /**
   * Get consultation by ID
   */
  async getConsultationById(consultationId: string): Promise<ConsultationWithRelations | null> {
    return await prisma.consultation.findUnique({
      where: { id: consultationId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            profilePhoto: true,
          },
        },
        astrologer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            profilePhoto: true,
          },
        },
        payment: true,
      },
    });
  }

  /**
   * Book a new consultation
   */
  async bookConsultation(data: BookConsultationData): Promise<ConsultationWithRelations> {
    // Validate astrologer exists
    const astrologer = await prisma.user.findFirst({
      where: {
        id: data.astrologerId,
        role: UserRole.ASTROLOGER,
        isActive: true,
      },
    });

    if (!astrologer) {
      throw new Error('Astrologer not found or inactive');
    }

    // Check for conflicting consultations
    const conflictingConsultation = await prisma.consultation.findFirst({
      where: {
        astrologerId: data.astrologerId,
        scheduledAt: {
          gte: new Date(data.scheduledAt.getTime() - data.duration * 60 * 1000),
          lte: new Date(data.scheduledAt.getTime() + data.duration * 60 * 1000),
        },
        status: {
          notIn: [ConsultationStatus.CANCELLED, ConsultationStatus.COMPLETED],
        },
      },
    });

    if (conflictingConsultation) {
      throw new Error('Astrologer is not available at the requested time');
    }

    // Create consultation
    const consultation = await prisma.consultation.create({
      data: {
        clientId: data.clientId,
        astrologerId: data.astrologerId,
        scheduledAt: data.scheduledAt,
        duration: data.duration,
        type: data.type,
        amount: data.amount,
        notes: data.notes,
        status: 'PENDING',
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            profilePhoto: true,
          },
        },
        astrologer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            profilePhoto: true,
          },
        },
      },
    });

    return consultation;
  }

  /**
   * Update consultation
   */
  async updateConsultation(
    consultationId: string,
    userId: string,
    data: UpdateConsultationData
  ): Promise<ConsultationWithRelations> {
    // Verify consultation exists and user has permission
    const consultation = await this.getConsultationById(consultationId);

    if (!consultation) {
      throw new Error('Consultation not found');
    }

    if (consultation.clientId !== userId && consultation.astrologerId !== userId) {
      throw new Error('Unauthorized to update this consultation');
    }

    // Update consultation
    const updated = await prisma.consultation.update({
      where: { id: consultationId },
      data,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            profilePhoto: true,
          },
        },
        astrologer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            profilePhoto: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Cancel consultation
   */
  async cancelConsultation(
    consultationId: string,
    userId: string
  ): Promise<ConsultationWithRelations> {
    return await this.updateConsultation(consultationId, userId, {
      status: ConsultationStatus.CANCELLED,
    });
  }

  /**
   * Get upcoming consultations for a user
   */
  async getUpcomingConsultations(
    userId: string,
    role: ConsultationUserRole
  ): Promise<ConsultationWithRelations[]> {
    const consultations = await prisma.consultation.findMany({
      where: {
        ...(role === UserRole.CLIENT ? { clientId: userId } : { astrologerId: userId }),
        scheduledAt: {
          gte: new Date(),
        },
        status: {
          notIn: [ConsultationStatus.CANCELLED, ConsultationStatus.COMPLETED],
        },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            profilePhoto: true,
          },
        },
        astrologer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            profilePhoto: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
      take: 10,
    });

    return consultations;
  }

  /**
   * Get consultation history for a user
   */
  async getConsultationHistory(
    userId: string,
    role: ConsultationUserRole
  ): Promise<ConsultationWithRelations[]> {
    const consultations = await prisma.consultation.findMany({
      where: {
        ...(role === UserRole.CLIENT ? { clientId: userId } : { astrologerId: userId }),
        status: 'COMPLETED',
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            profilePhoto: true,
          },
        },
        astrologer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            profilePhoto: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    });

    return consultations;
  }

  /**
   * Rate and review consultation
   */
  async rateConsultation(
    consultationId: string,
    clientId: string,
    rating: number,
    review?: string
  ): Promise<ConsultationWithRelations> {
    // Verify consultation exists and belongs to client
    const consultation = await this.getConsultationById(consultationId);

    if (!consultation) {
      throw new Error('Consultation not found');
    }

    if (consultation.clientId !== clientId) {
      throw new Error('Unauthorized to rate this consultation');
    }

    if (consultation.status !== ConsultationStatus.COMPLETED) {
      throw new Error('Can only rate completed consultations');
    }

    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    return await prisma.consultation.update({
      where: { id: consultationId },
      data: {
        rating,
        review,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            profilePhoto: true,
          },
        },
        astrologer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            profilePhoto: true,
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            transactionId: true,
          },
        },
      },
    });
  }
}

export const consultationService = new ConsultationService();
