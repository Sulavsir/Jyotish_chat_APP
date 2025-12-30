/**
 * Admin Panel Type Definitions
 */

export interface Admin {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Astrologer {
  id: string;
  phone: string;
  email?: string;
  name: string;
  profilePhoto?: string;
  bio?: string;
  specialization: string[];
  experience?: number;
  rating?: number;
  totalConsultations: number;
  isActive: boolean;
  isOnline: boolean;
  isVerified: boolean;
  commissionRate: number;
  languages: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  phone: string;
  email?: string;
  name?: string;
  role: 'CLIENT';
  isActive: boolean;
  profilePhoto?: string;
  profileCompleted: boolean;
  zodiacSign?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  userId?: string;
  astrologerId?: string;
  adminId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface ChatMonitor {
  id: string;
  participant1Id: string;
  participant2Id: string;
  participant1Type: 'CLIENT';
  participant2Type: 'ASTROLOGER';
  status: 'ACTIVE' | 'ENDED';
  lastMessageAt?: Date;
  lastMessageText?: string;
  isMonitoredByAdmin: boolean;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  client?: User;
  astrologer?: Astrologer;
  messageCount?: number;
}

export interface MessageMonitor {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  senderType: 'CLIENT' | 'ASTROLOGER';
  receiverType: 'CLIENT' | 'ASTROLOGER';
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'VIDEO';
  isRead: boolean;
  isDeleted: boolean;
  flaggedByAdmin: boolean;
  adminNotes?: string;
  createdAt: Date;
}

export interface AstrologerEarnings {
  id: string;
  astrologerId: string;
  consultationId?: string;
  chatId?: string;
  amount: number;
  commission: number;
  netEarning: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  payoutDate?: Date;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
  astrologer?: Astrologer;
}

export interface DashboardStats {
  totalUsers: number;
  totalAstrologers: number;
  activeChats: number;
  totalEarnings: number;
  pendingEarnings: number;
  todayConsultations: number;
  userGrowth: number;
  astrologerGrowth: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Form types
export interface CreateAstrologerForm {
  phone: string;
  email?: string;
  password: string;
  name: string;
  bio?: string;
  specialization: string[];
  experience?: number;
  commissionRate: number;
  languages: string[];
}

export interface UpdateAstrologerForm {
  email?: string;
  name?: string;
  bio?: string;
  specialization?: string[];
  experience?: number;
  commissionRate?: number;
  languages?: string[];
  isActive?: boolean;
  isVerified?: boolean;
}

export interface LoginForm {
  email: string;
  password: string;
}

