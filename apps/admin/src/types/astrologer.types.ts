export interface ListAstrologersParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  isVerified?: boolean;
  isOnline?: boolean;
}

export interface RegistrationRequest {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  profilePhoto: string | null;
  bio: string | null;
  specialization: string[];
  experience: number | null;
  languages: string[];
  gender: string | null;
  proofOfAstrology: string;
  registrationRequestedAt: string;
  createdAt: string;
}

export interface CreateAstrologerRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  specialization: string[];
  experience: number;
  chatMessageCommissionPercent: number;
  broadcastMessageCommissionPercent: number;
  firstBroadcastCommissionPercent: number;
  kundaliReviewCommissionPercent: number;
  appointmentCommissionPercent: number;
  category: 'ORDINARY' | 'PROFESSIONAL' | 'PREMIUM' | 'KATHA_VACHAK';
  appointmentFee?: number | null;
  chatMessageFee?: number | null;
  languages: string[];
  bio?: string;
  address?: string | null;
  country?: string | null;
}

export interface UpdateAstrologerRequest {
  editPassword?: string;
  name?: string;
  email?: string | null;
  phone?: string;
  bio?: string | null;
  address?: string | null;
  profilePhoto?: string | null;
  specialization?: string[];
  experience?: number | null;
  chatMessageCommissionPercent?: number;
  broadcastMessageCommissionPercent?: number;
  firstBroadcastCommissionPercent?: number;
  kundaliReviewCommissionPercent?: number;
  appointmentCommissionPercent?: number;
  languages?: string[];
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  category?: 'ORDINARY' | 'PROFESSIONAL' | 'PREMIUM' | 'KATHA_VACHAK';
  appointmentFee?: number | null;
  proofOfAstrology?: string | null;
  chatMessageFee?: number | null;
  country?: string | null;
  inhouseAstrologer?: boolean;
}


