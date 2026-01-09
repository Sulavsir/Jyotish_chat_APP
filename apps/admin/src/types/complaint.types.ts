/**
 * Complaint Types for Admin
 * Types for managing user complaints in the admin panel
 */

export enum ComplaintStatus {
  PENDING = 'PENDING',
  IN_REVIEW = 'IN_REVIEW',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
  ESCALATED = 'ESCALATED',
}

export enum ComplaintCategory {
  NO_RESPONSE = 'NO_RESPONSE',
  SLOW_RESPONSE = 'SLOW_RESPONSE',
  INAPPROPRIATE_BEHAVIOR = 'INAPPROPRIATE_BEHAVIOR',
  POOR_SERVICE_QUALITY = 'POOR_SERVICE_QUALITY',
  TECHNICAL_ISSUE = 'TECHNICAL_ISSUE',
  BILLING_ISSUE = 'BILLING_ISSUE',
  OTHER = 'OTHER',
}

export enum ComplaintPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface Complaint {
  id: string;
  clientId: string;
  astrologerId: string;
  chatId?: string | null;
  subject: string;
  description: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  attachmentUrl?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: Date | string | null;
  resolution?: string | null;
  adminNotes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  client?: {
    id: string;
    name: string | null;
    phone: string;
    email?: string | null;
    profilePhoto?: string | null;
  };
  astrologer?: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    profilePhoto?: string | null;
  };
  chat?: {
    id: string;
    status: 'ACTIVE' | 'ENDED';
    createdAt?: Date | string;
    lastMessageAt?: Date | string | null;
  } | null;
  resolver?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface ComplaintStats {
  total: number;
  pending: number;
  inReview: number;
  resolved: number;
  dismissed: number;
  escalated: number;
}

export interface UpdateComplaintStatusPayload {
  status: ComplaintStatus;
  adminNotes?: string;
  priority?: ComplaintPriority;
}

export interface ResolveComplaintPayload {
  resolution: string;
  adminNotes?: string;
}

// Human-readable labels for enums
export const COMPLAINT_CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  [ComplaintCategory.NO_RESPONSE]: 'No Response from Astrologer',
  [ComplaintCategory.SLOW_RESPONSE]: 'Slow Response Time',
  [ComplaintCategory.INAPPROPRIATE_BEHAVIOR]: 'Inappropriate Behavior',
  [ComplaintCategory.POOR_SERVICE_QUALITY]: 'Poor Service Quality',
  [ComplaintCategory.TECHNICAL_ISSUE]: 'Technical Issue',
  [ComplaintCategory.BILLING_ISSUE]: 'Billing or Payment Issue',
  [ComplaintCategory.OTHER]: 'Other Issue',
};

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  [ComplaintStatus.PENDING]: 'Pending Review',
  [ComplaintStatus.IN_REVIEW]: 'Under Review',
  [ComplaintStatus.RESOLVED]: 'Resolved',
  [ComplaintStatus.DISMISSED]: 'Dismissed',
  [ComplaintStatus.ESCALATED]: 'Escalated',
};

export const COMPLAINT_PRIORITY_LABELS: Record<ComplaintPriority, string> = {
  [ComplaintPriority.LOW]: 'Low',
  [ComplaintPriority.MEDIUM]: 'Medium',
  [ComplaintPriority.HIGH]: 'High',
  [ComplaintPriority.URGENT]: 'Urgent',
};

// Status colors for badges
export const COMPLAINT_STATUS_COLORS: Record<ComplaintStatus, string> = {
  [ComplaintStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [ComplaintStatus.IN_REVIEW]: 'bg-blue-100 text-blue-800 border-blue-200',
  [ComplaintStatus.RESOLVED]: 'bg-green-100 text-green-800 border-green-200',
  [ComplaintStatus.DISMISSED]: 'bg-gray-100 text-gray-800 border-gray-200',
  [ComplaintStatus.ESCALATED]: 'bg-red-100 text-red-800 border-red-200',
};

// Priority colors for badges
export const COMPLAINT_PRIORITY_COLORS: Record<ComplaintPriority, string> = {
  [ComplaintPriority.LOW]: 'bg-gray-100 text-gray-700',
  [ComplaintPriority.MEDIUM]: 'bg-blue-100 text-blue-700',
  [ComplaintPriority.HIGH]: 'bg-orange-100 text-orange-700',
  [ComplaintPriority.URGENT]: 'bg-red-100 text-red-700',
};
