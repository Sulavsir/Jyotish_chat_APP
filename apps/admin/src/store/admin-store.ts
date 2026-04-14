/**
 * Admin Store - Zustand state management for admin panel
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminRole } from '@jyotish/shared';

interface Admin {
  id: string;
  email: string;
  name: string;
  adminRole?: AdminRole;
}

interface AdminState {
  admin: Admin | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setAdmin: (admin: Admin | null) => void;
  logout: () => void;
  setHasHydrated: (hydrated: boolean) => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      admin: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setAdmin: (admin) =>
        set({
          admin,
          isAuthenticated: !!admin,
        }),

      logout: () =>
        set({
          admin: null,
          isAuthenticated: false,
        }),

      setHasHydrated: (hydrated) =>
        set({
          _hasHydrated: hydrated,
        }),
    }),
    {
      name: 'admin-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

