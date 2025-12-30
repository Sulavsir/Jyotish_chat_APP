/**
 * Auth Slice - Authentication State Management
 */

import { StateCreator } from 'zustand';
import type { User } from '@jyotish/shared';

export interface AuthSlice {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
}

export const authSlice: StateCreator<AuthSlice> = (set) => ({
  // Initial State
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  // Actions
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setToken: (token) =>
    set({
      token,
    }),

  login: (user, token) =>
    set({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    }),

  logout: () =>
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    }),

  updateUser: (userData) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...userData } : null,
    })),

  setLoading: (loading) =>
    set({
      isLoading: loading,
    }),
});

