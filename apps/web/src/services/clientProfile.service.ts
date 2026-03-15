/**
 * Client Profile Service
 * Family/friend profiles for asking questions on behalf of someone
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';
import type { ClientProfile } from '@jyotish/shared';

export interface ClientProfilesResponse {
  profiles: ClientProfile[];
}

export interface CreateClientProfilePayload {
  name: string;
  relationship: string;
  dateOfBirth?: string | null;
  timeOfBirth?: string | null;
  placeOfBirth?: string | null;
  placeOfBirthType?: 'NEPAL' | 'OUTSIDE_NEPAL' | null;
  placeOfBirthPradeshId?: string | null;
  placeOfBirthDistrictId?: string | null;
  placeOfBirthLocation?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
}

export const clientProfileService = {
  async list(): Promise<ClientProfilesResponse> {
    return apiClient.get<ClientProfilesResponse>(API_ENDPOINTS.USER.PROFILES);
  },

  async create(data: CreateClientProfilePayload): Promise<{ profile: ClientProfile }> {
    return apiClient.post<{ profile: ClientProfile }>(API_ENDPOINTS.USER.PROFILES, data);
  },

  async update(
    id: string,
    data: Partial<CreateClientProfilePayload>
  ): Promise<{ profile: ClientProfile }> {
    return apiClient.patch<{ profile: ClientProfile }>(API_ENDPOINTS.USER.PROFILE_BY_ID(id), data);
  },

  async remove(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(API_ENDPOINTS.USER.PROFILE_BY_ID(id));
  },
};
