/**
 * useAuth Hook - Authentication logic
 */

import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ROUTES, USER_ROLES, getDashboardRoute } from '@/constants';

export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    try {
      logout();
      router.push(ROUTES.HOME);
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  /**
   * Get the appropriate dashboard route based on user role
   */
  const getDashboard = () => {
    return getDashboardRoute(user?.role);
  };

  /**
   * Check if user has a specific role
   */
  const hasRole = (role: string) => {
    return user?.role === role;
  };

  /**
   * Check if user is a client
   */
  const isClient = () => {
    return user?.role === USER_ROLES.CLIENT;
  };

  /**
   * Check if user is an astrologer
   */
  const isAstrologer = () => {
    return user?.role === USER_ROLES.ASTROLOGER;
  };

  /**
   * Check if user is an admin
   */
  const isAdmin = () => {
    return user?.role === USER_ROLES.ADMIN;
  };

  return {
    user,
    isAuthenticated,
    handleLogout,
    getDashboard,
    hasRole,
    isClient,
    isAstrologer,
    isAdmin,
  };
}
