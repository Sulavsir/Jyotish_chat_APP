/**
 * Dashboard Rotating Copy Validators
 */

import { z } from 'zod';
import { DASHBOARD_ROTATING_COPY } from '../constants';

export const createDashboardRotatingCopySchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(DASHBOARD_ROTATING_COPY.TITLE_MAX_LENGTH, 'Title is too long'),
  subtitle: z
    .string()
    .min(1, 'Subtitle is required')
    .max(DASHBOARD_ROTATING_COPY.SUBTITLE_MAX_LENGTH, 'Subtitle is too long'),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateDashboardRotatingCopySchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(DASHBOARD_ROTATING_COPY.TITLE_MAX_LENGTH, 'Title is too long')
      .optional(),
    subtitle: z
      .string()
      .min(1, 'Subtitle is required')
      .max(DASHBOARD_ROTATING_COPY.SUBTITLE_MAX_LENGTH, 'Subtitle is too long')
      .optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one field must be provided',
  });

