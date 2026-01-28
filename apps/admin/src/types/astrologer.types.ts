/**
 * Astrologer-related type definitions
 */

export interface RegistrationRequest {
  id: string;
  name: string;
  phone: string;
  email: string | null;
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
}

export interface UpdateAstrologerRequest {
  email?: string;
  name?: string;
  bio?: string;
  profilePhoto?: string;
  specialization?: string[];
  experience?: number;
  commissionRate?: number;
  languages?: string[];
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}
