/**
 * Settings-related type definitions
 */

import type { User } from '@jyotish/shared';

export interface ChangePasswordResponse {
  message: string;
  user?: User;
}

export interface SetPasswordResponse {
  message: string;
  user?: User;
}


