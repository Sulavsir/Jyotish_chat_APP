/**
 * Complaint Types
 * Types for user complaints against astrologers
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
  resolvedAt?: Date | null;
  resolution?: string | null;
  adminNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
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
    createdAt?: Date;
    lastMessageAt?: Date | null;
  } | null;
  resolver?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface CreateComplaintData {
  astrologerId: string;
  chatId?: string;
  subject: string;
  description: string;
  category: ComplaintCategory;
  attachment?: File | null;
}

export interface ComplaintListResponse {
  complaints: Complaint[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
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
