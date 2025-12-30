import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types/auth';
import { SESSION_CONFIG } from '@/constants';
import { TokenManager } from '@/lib/auth';
import { authApi } from '@/lib/auth-api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;

  // OTP Flow State
  otpSessionId: string | null;
  phoneNumber: string | null;
  tempToken: string | null;

  // Actions
  setUser: (user: User) => void;
  setAuth: (user: User) => void; // Tokens are in httpOnly cookies
  logout: () => Promise<void>; // Async to call backend

  // OTP Flow Actions
  setOtpSession: (sessionId: string, phoneNumber: string) => void;
  setTempToken: (tempToken: string) => void;
  clearOtpSession: () => void;
}

// Custom storage with expiration

const expirationStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;

    try {
      const item = localStorage.getItem(name);
      if (!item) return null;

      const parsed = JSON.parse(item);
      const now = Date.now();

      // Check if expired
      if (parsed.expiry && now > parsed.expiry) {
        localStorage.removeItem(name);
        return null;
      }

      return JSON.stringify(parsed.state);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;

    try {
      const expiry = Date.now() + SESSION_CONFIG.EXPIRATION_MS;
      const item = {
        state: JSON.parse(value),
        expiry,
      };
      localStorage.setItem(name, JSON.stringify(item));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      otpSessionId: null,
      phoneNumber: null,
      tempToken: null,

      setUser: (user) => set({ user, isAuthenticated: true }),

      setAuth: (user) => {
        // Tokens are automatically stored as httpOnly cookies by server
        // Just update store state with user
        set({ user, isAuthenticated: true });
      },

      logout: async () => {
        try {
          // Call backend to clear cookies and revoke session
          await authApi.logout();
        } catch (error) {
          console.error('Logout error:', error);
          // Continue with local logout even if backend call fails
        }
        
        // Clear local state
        TokenManager.clearTokens();
        set({
          user: null,
          isAuthenticated: false,
          otpSessionId: null,
          phoneNumber: null,
          tempToken: null,
        });
      },

      setOtpSession: (sessionId, phoneNumber) =>
        set({
          otpSessionId: sessionId,
          phoneNumber,
        }),

      setTempToken: (tempToken) => set({ tempToken }),

      clearOtpSession: () =>
        set({
          otpSessionId: null,
          phoneNumber: null,
          tempToken: null,
        }),
    }),
    {
      name: 'jyotish-auth',
      storage: createJSONStorage(() => expirationStorage),
      partialize: (state) => ({
        user: state.user,
        // Tokens are in httpOnly cookies - managed by server
        isAuthenticated: state.isAuthenticated,
        tempToken: state.tempToken,
        phoneNumber: state.phoneNumber,
      }),
    }
  )
);
