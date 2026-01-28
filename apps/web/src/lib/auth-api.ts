import { API_ENDPOINTS, type GenderType } from '@/constants';
import { apiClient } from './api-client';
import { TokenManager } from '@/lib/auth';
import { useAuthStore } from '@/store/auth-store';
import { getDeviceInfo } from '@/utils/device.utils';
import type {
  CheckPhoneRequest,
  CheckPhoneResponse,
  SendOTPRequest,
  SendOTPResponse,
  VerifyOTPRequest,
  VerifyOTPResponse,
  SetPasswordRequest,
  SetPasswordResponse,
  LoginRequest,
  LoginResponse,
  LoginWithOTPRequest,
  LoginWithOTPResponse,
  VerifyLoginOTPRequest,
  VerifyLoginOTPResponse,
  ProfileSetupRequest,
  ProfileSetupResponse,
  User,
} from '@/types/auth';
import { UserRole } from '@/types';

export const authApi = {
  checkPhone: async (data: CheckPhoneRequest): Promise<CheckPhoneResponse> => {
    return apiClient.post<CheckPhoneResponse>(API_ENDPOINTS.AUTH.CHECK_PHONE, data, false);
  },

  sendOTP: async (data: SendOTPRequest): Promise<SendOTPResponse> => {
    return apiClient.post<SendOTPResponse>(API_ENDPOINTS.AUTH.SEND_OTP, data, false);
  },

  verifyOTP: async (data: VerifyOTPRequest): Promise<VerifyOTPResponse> => {
    // TEMPORARY: Device tracking disabled - will implement properly later
    // const deviceInfo = getDeviceInfo();
    // const requestData = {
    //   ...data,
    //   ...deviceInfo,
    // };

    // Call verify OTP endpoint (tokens are set as httpOnly cookies by server)
    const response = await apiClient.post<VerifyOTPResponse>(
      API_ENDPOINTS.AUTH.VERIFY_OTP,
      data, // Device info temporarily disabled
      false
    );

    // Tokens are automatically stored as httpOnly cookies by server
    // No manual token management needed

    return response;
  },

  setPassword: async (data: SetPasswordRequest): Promise<SetPasswordResponse> => {
    // Call set password endpoint (tokens are set as httpOnly cookies by server)
    const response = await apiClient.post<SetPasswordResponse>(
      API_ENDPOINTS.AUTH.SET_PASSWORD,
      data,
      false
    );

    // Tokens are automatically stored as httpOnly cookies by server
    // No manual token management needed

    return response;
  },

  login: async (data: LoginRequest): Promise<LoginResponse> => {
    // TEMPORARY: Device tracking disabled - will implement properly later
    // const deviceInfo = getDeviceInfo();
    // const requestData = {
    //   ...data,
    //   ...deviceInfo,
    // };

    // Call login endpoint (tokens are set as httpOnly cookies by server)
    const response = await apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, data, false); // Device info temporarily disabled

    // Tokens are automatically stored as httpOnly cookies by server
    // No manual token management needed

    return response;
  },

  // Passwordless login with OTP
  loginWithOTP: async (data: LoginWithOTPRequest): Promise<LoginWithOTPResponse> => {
    return apiClient.post<LoginWithOTPResponse>(API_ENDPOINTS.AUTH.LOGIN_WITH_OTP, data, false);
  },

  verifyLoginOTP: async (data: VerifyLoginOTPRequest): Promise<VerifyLoginOTPResponse> => {
    // Call verify login OTP endpoint (tokens are set as httpOnly cookies by server)
    const response = await apiClient.post<VerifyLoginOTPResponse>(
      API_ENDPOINTS.AUTH.VERIFY_LOGIN_OTP,
      data,
      false
    );

    // Tokens are automatically stored as httpOnly cookies by server
    // No manual token management needed

    return response;
  },

  logout: async (): Promise<void> => {
    // Call backend to revoke session and clear httpOnly cookies
    try {
      await apiClient.post<void>(API_ENDPOINTS.AUTH.LOGOUT, {});
    } catch (error) {
      // Continue with logout even if server call fails
      console.error('Logout error (ignored):', error);
    } finally {
      // Clear local storage
      TokenManager.clearTokens();
    }
  },

  getProfile: async (): Promise<User> => {
    // ALWAYS check store first to determine role
    const user = useAuthStore.getState().user;

    // If user is in store and is an astrologer, use astrologer endpoint
    if (user?.role === 'ASTROLOGER') {
      const response = await apiClient.get<{ astrologer: User }>(API_ENDPOINTS.ASTROLOGER.ME);
      return response.astrologer;
    }

    // Check if we're on an astrologer route as secondary check
    const isAstrologerRoute =
      typeof window !== 'undefined' && window.location.pathname.startsWith('/jyotish');

    if (isAstrologerRoute) {
      const response = await apiClient.get<{ astrologer: User }>(API_ENDPOINTS.ASTROLOGER.ME);
      return response.astrologer;
    }

    // Only default to user endpoint if we're certain it's a client
    return apiClient.get<User>(API_ENDPOINTS.USER.ME);
  },

  setupProfile: async (data: ProfileSetupRequest): Promise<ProfileSetupResponse> => {
    // If there's a profile photo, upload it separately
    if (data.profilePhoto) {
      const formData = new FormData();
      formData.append('photo', data.profilePhoto);
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'profilePhoto' && value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      return apiClient.uploadFile<ProfileSetupResponse>(API_ENDPOINTS.USER.PROFILE_SETUP, formData);
    }

    // Without photo, send as JSON
    const { profilePhoto, ...jsonData } = data;
    return apiClient.post<ProfileSetupResponse>(API_ENDPOINTS.USER.PROFILE_SETUP, jsonData);
  },

  updateProfile: async (data: { name?: string; email?: string }): Promise<User> => {
    return apiClient.patch<User>(API_ENDPOINTS.USER.ME, data);
  },

  updateBirthDetails: async (data: {
    dateOfBirth?: string;
    timeOfBirth?: string;
    placeOfBirth?: string;
    currentAddress?: string;
    permanentAddress?: string;
    gender?: GenderType;
    zodiacSign?: string;
  }): Promise<User> => {
    return apiClient.patch<User>(API_ENDPOINTS.USER.BIRTH_DETAILS, data);
  },

  uploadProfilePhoto: async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append('photo', file);
    return apiClient.uploadFile<User>(API_ENDPOINTS.USER.UPLOAD_PHOTO, formData);
  },

  removeProfilePhoto: async (): Promise<User> => {
    return apiClient.delete<User>(API_ENDPOINTS.USER.REMOVE_PHOTO);
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<{ message: string }> => {
    return apiClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
  },

  setPasswordForExistingUser: async (password: string): Promise<{ message: string }> => {
    return apiClient.post(API_ENDPOINTS.AUTH.SET_PASSWORD_EXISTING, { password });
  },

  // Astrologer-specific endpoints
  loginAstrologer: async (data: {
    identifier: string;
    password: string;
  }): Promise<{ astrologer: User }> => {
    // TEMPORARY: Device tracking disabled - will implement properly later
    // const deviceInfo = getDeviceInfo();
    // const requestData = {
    //   ...data,
    //   ...deviceInfo,
    // };

    // Call astrologer login endpoint (tokens are set as httpOnly cookies by server)
    const response = await apiClient.post<{ astrologer: User }>(
      API_ENDPOINTS.ASTROLOGER.LOGIN,
      data, // Device info temporarily disabled
      false
    );

    // Ensure returned astrologer includes the correct role
    return {
      astrologer: {
        ...response.astrologer,
        role: UserRole.ASTROLOGER,
      },
    };
  },

  getAstrologerProfile: async (): Promise<User> => {
    const response = await apiClient.get<{ astrologer: User }>(API_ENDPOINTS.ASTROLOGER.ME);
    const astrologer = response.astrologer;
    return { ...astrologer, role: UserRole.ASTROLOGER };
  },

  logoutAstrologer: async (): Promise<void> => {
    // Call backend to revoke session and clear httpOnly cookies
    try {
      await apiClient.post<void>(API_ENDPOINTS.ASTROLOGER.LOGOUT, {});
    } catch (error) {
      // Continue with logout even if server call fails
      console.error('Logout error (ignored):', error);
    } finally {
      // Clear local storage
      TokenManager.clearTokens();
    }
  },
};
