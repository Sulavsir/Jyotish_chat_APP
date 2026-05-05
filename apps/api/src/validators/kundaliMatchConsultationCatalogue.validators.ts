import { z } from 'zod';
import { queryPaginationSchema } from './query.validators';

export const listAdminConsultationCatalogueQuerySchema = queryPaginationSchema.extend({
  search: z
    .string()
    .optional()
    .transform((s) => (s && s.trim() ? s.trim() : undefined)),
});

export const moveKundaliConsultationQuestionBodySchema = z.object({
  direction: z.enum(['up', 'down']),
});

export const updateKundaliConsultationTitleSchema = z.object({
  titleNe: z.string().trim().min(1, 'Title is required').max(512),
});

export const createKundaliConsultationQuestionSchema = z.object({
  textNe: z.string().trim().min(1, 'Question text is required').max(6000),
  sortOrder: z.number().int().min(1).max(10_000).optional(),
});

export const updateKundaliConsultationQuestionSchema = z
  .object({
    textNe: z.string().trim().min(1).max(6000).optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().min(1).max(10_000).optional(),
  })
  .refine((b) => b.textNe !== undefined || b.isActive !== undefined || b.sortOrder !== undefined, {
    message: 'Provide at least one field to update',
  });

export const reorderKundaliConsultationQuestionsSchema = z.object({
  orderedIds: z.array(z.string().trim().min(1).max(128)).min(1),
});

export const kundaliConsultationQuestionIdParamSchema = z.object({
  questionId: z.string().trim().min(1).max(128),
});
