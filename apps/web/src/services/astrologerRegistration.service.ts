/**
 * Astrologer Registration Service
 */

import { axiosInstance } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';
import type { Gender, AstrologerAccountStatus } from '@prisma/client';

export interface AstrologerRegistrationData {
  name: string;
  phone: string;
  email?: string;
  password: string;
  bio?: string;
  address?: string | null;
  profilePhoto?: File | null;
  specialization: string[];
  experience?: number;
  languages: string[];
  gender?: Gender | null;
  proofOfAstrology: File | File[];
}

export interface AstrologerRegistrationResponse {
  message: string;
  astrologer: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    accountStatus: AstrologerAccountStatus;
    registrationRequestedAt: string;
    createdAt: string;
  };
}

export const astrologerRegistrationService = {
  /**
   * Register as astrologer (submit registration request)
   */
  async register(data: AstrologerRegistrationData): Promise<AstrologerRegistrationResponse> {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('phone', data.phone);
    if (data.email) {
      formData.append('email', data.email);
    }
    formData.append('password', data.password);
    if (data.bio) {
      formData.append('bio', data.bio);
    }
    if (data.address) {
      formData.append('address', data.address);
    }
    if (data.profilePhoto) {
      formData.append('profilePhoto', data.profilePhoto);
    }
    data.specialization.forEach((spec) => {
      formData.append('specialization', spec);
    });
    if (data.experience) {
      formData.append('experience', data.experience.toString());
    }
    data.languages.forEach((lang) => {
      formData.append('languages', lang);
    });
    if (data.gender) {
      formData.append('gender', data.gender);
    }
    // Handle multiple files
    const files = Array.isArray(data.proofOfAstrology) ? data.proofOfAstrology : [data.proofOfAstrology];
    files.forEach((file) => {
      formData.append('proofOfAstrology', file);
    });

    const response = await axiosInstance.post<{ data: AstrologerRegistrationResponse }>(
      API_ENDPOINTS.ASTROLOGER.REGISTER,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: false,
      }
    );
    return response.data.data ?? response.data;
  },
};
