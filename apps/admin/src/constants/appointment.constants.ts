/**
 * Appointment Constants for Admin Panel
 */

import { AppointmentStatus, AstrologerCategory } from '@/types/appointment.types';
import { AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';

export const APPOINTMENT_STATUS = {
  PENDING: AppointmentStatus.PENDING,
  CONFIRMED: AppointmentStatus.CONFIRMED,
  IN_PROGRESS: AppointmentStatus.IN_PROGRESS,
  COMPLETED: AppointmentStatus.COMPLETED,
  CANCELLED: AppointmentStatus.CANCELLED,
  NO_SHOW: AppointmentStatus.NO_SHOW,
} as const;

export const ASTROLOGER_CATEGORY = {
  ORDINARY: AstrologerCategory.ORDINARY,
  PROFESSIONAL: AstrologerCategory.PROFESSIONAL,
  PREMIUM: AstrologerCategory.PREMIUM,
  KATHA_VACHAK: AstrologerCategory.KATHA_VACHAK,
} as const;

export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  [AppointmentStatus.CONFIRMED]: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  [AppointmentStatus.IN_PROGRESS]: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  [AppointmentStatus.COMPLETED]: 'bg-green-500/10 text-green-500 border-green-500/20',
  [AppointmentStatus.CANCELLED]: 'bg-red-500/10 text-red-500 border-red-500/20',
  [AppointmentStatus.NO_SHOW]: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

export const APPOINTMENT_STATUS_ICONS: Record<AppointmentStatus, typeof AlertCircle> = {
  [AppointmentStatus.PENDING]: AlertCircle,
  [AppointmentStatus.CONFIRMED]: CheckCircle2,
  [AppointmentStatus.IN_PROGRESS]: Clock,
  [AppointmentStatus.COMPLETED]: CheckCircle2,
  [AppointmentStatus.CANCELLED]: XCircle,
  [AppointmentStatus.NO_SHOW]: XCircle,
};

export const ASTROLOGER_CATEGORY_COLORS: Record<AstrologerCategory, string> = {
  [AstrologerCategory.PREMIUM]: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  [AstrologerCategory.PROFESSIONAL]: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  [AstrologerCategory.ORDINARY]: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  [AstrologerCategory.KATHA_VACHAK]: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20',
};
