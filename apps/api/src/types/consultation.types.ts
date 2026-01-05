/**
 * Consultation Type Definitions
 */

import type { ConsultationType, ConsultationStatus, UserRole } from '@jyotish/shared';

export interface BookConsultationData {
  clientId: string;
  astrologerId: string;
  scheduledAt: Date;
  duration: number;
  type: ConsultationType;
  amount: number;
  notes?: string;
}

export interface UpdateConsultationData {
  status?: ConsultationStatus;
  notes?: string;
  rating?: number;
  review?: string;
}

export type ConsultationUserRole = UserRole.CLIENT | UserRole.ASTROLOGER;
