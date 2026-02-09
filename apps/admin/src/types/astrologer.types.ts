/**
 * Astrologer-related type definitions
 */

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
  commissionRate: number;
  category: 'ORDINARY' | 'PROFESSIONAL' | 'PREMIUM' | 'KATHA_VACHAK';
  appointmentFee?: number | null;
  languages: string[];
  bio?: string;
  address?: string | null;
}

export interface UpdateAstrologerRequest {
  name?: string;
  email?: string | null;
  phone?: string;
  bio?: string | null;
  address?: string | null;
  profilePhoto?: string | null;
  specialization?: string[];
  experience?: number | null;
  commissionRate?: number;
  languages?: string[];
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  category?: 'ORDINARY' | 'PROFESSIONAL' | 'PREMIUM' | 'KATHA_VACHAK';
  appointmentFee?: number | null;
  proofOfAstrology?: string | null;
}
