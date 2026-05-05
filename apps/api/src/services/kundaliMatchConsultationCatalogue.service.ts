/**
 * Admin-managed kundali match consultation topics + title (Settings).
 */

import { prisma } from '@jyotish/database';
import type { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  KUNDALI_MATCH_PREMIUM_CONSULTATION_TITLE_NE,
  KUNDALI_MATCH_PREMIUM_CONSULTATION_QUESTIONS,
} from '@jyotish/shared';
import { SETTINGS_KEYS } from '../constants/settings.constants';
import { AppError, ERROR_CODES, HTTP_STATUS } from '../utils';

export interface ConsultationQuestionDTO {
  id: string;
  textNe: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function getConsultationTitleNe(): Promise<string> {
  const row = await prisma.settings.findUnique({
    where: { key: SETTINGS_KEYS.KUNDALI_MATCH_CONSULTATION_TITLE_NE },
    select: { value: true },
  });
  if (row?.value?.trim()) return row.value.trim();
  return KUNDALI_MATCH_PREMIUM_CONSULTATION_TITLE_NE;
}

async function ensureCatalogueNotEmpty(): Promise<void> {
  const n = await prisma.kundaliMatchConsultationQuestion.count();
  if (n > 0) return;
  const now = new Date();
  await prisma.$transaction(
    KUNDALI_MATCH_PREMIUM_CONSULTATION_QUESTIONS.map((q, i) =>
      prisma.kundaliMatchConsultationQuestion.create({
        data: {
          id: q.id,
          textNe: q.textNe,
          sortOrder: i + 1,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      })
    )
  );
}

export async function getPublicCatalogue(): Promise<{
  titleNe: string;
  questions: { id: string; textNe: string }[];
}> {
  await ensureCatalogueNotEmpty();
  const titleNe = await getConsultationTitleNe();
  const questions = await prisma.kundaliMatchConsultationQuestion.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: { id: true, textNe: true },
  });
  return { titleNe, questions };
}

export async function listConsultationCataloguePaginated(options: {
  page: number;
  limit: number;
  search?: string;
}): Promise<{
  titleNe: string;
  questions: ConsultationQuestionDTO[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  await ensureCatalogueNotEmpty();
  const titleNe = await getConsultationTitleNe();
  const page = Math.max(1, options.page);
  const limit = Math.min(100, Math.max(1, options.limit));
  const skip = (page - 1) * limit;
  const q = options.search?.trim();

  const where: Prisma.KundaliMatchConsultationQuestionWhereInput = q
    ? {
        OR: [
          { id: { contains: q, mode: 'insensitive' as const } },
          { textNe: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [questions, total] = await Promise.all([
    prisma.kundaliMatchConsultationQuestion.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      skip,
      take: limit,
      select: {
        id: true,
        textNe: true,
        sortOrder: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.kundaliMatchConsultationQuestion.count({ where }),
  ]);

  const totalPages = total === 0 ? 1 : Math.ceil(total / limit);

  return {
    titleNe,
    questions,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export async function getConsultationCatalogueLookup(): Promise<{
  titleNe: string;
  questions: { id: string; textNe: string; sortOrder: number }[];
}> {
  await ensureCatalogueNotEmpty();
  const titleNe = await getConsultationTitleNe();
  const questions = await prisma.kundaliMatchConsultationQuestion.findMany({
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: { id: true, textNe: true, sortOrder: true },
  });
  return { titleNe, questions };
}

export async function moveQuestionRelative(questionId: string, direction: 'up' | 'down'): Promise<void> {
  await ensureCatalogueNotEmpty();
  const ordered = await prisma.kundaliMatchConsultationQuestion.findMany({
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: { id: true },
  });
  const idx = ordered.findIndex((r) => r.id === questionId);
  if (idx === -1) {
    throw new AppError('Question not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  const j = direction === 'up' ? idx - 1 : idx + 1;
  if (j < 0 || j >= ordered.length) return;
  const ids = ordered.map((r) => r.id);
  const t = ids[idx];
  ids[idx] = ids[j];
  ids[j] = t;
  await reorderQuestions(ids);
}

export async function updateConsultationTitleNe(titleNe: string): Promise<string> {
  const trimmed = titleNe.trim();
  await prisma.settings.upsert({
    where: { key: SETTINGS_KEYS.KUNDALI_MATCH_CONSULTATION_TITLE_NE },
    create: {
      key: SETTINGS_KEYS.KUNDALI_MATCH_CONSULTATION_TITLE_NE,
      value: trimmed,
      description: 'Title shown above kundali match consultation topics (Nepali)',
    },
    update: { value: trimmed },
  });
  return trimmed;
}

export async function createQuestion(input: {
  textNe: string;
  sortOrder?: number;
}): Promise<ConsultationQuestionDTO> {
  const textNe = input.textNe.trim();
  const maxOrder = await prisma.kundaliMatchConsultationQuestion.aggregate({
    _max: { sortOrder: true },
  });
  const nextOrder = (maxOrder._max.sortOrder ?? 0) + 1;
  const sortOrder = input.sortOrder ?? nextOrder;
  const id = randomUUID();
  const row = await prisma.kundaliMatchConsultationQuestion.create({
    data: {
      id,
      textNe,
      sortOrder,
      isActive: true,
    },
    select: {
      id: true,
      textNe: true,
      sortOrder: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return row;
}

export async function updateQuestion(
  questionId: string,
  input: { textNe?: string; isActive?: boolean; sortOrder?: number }
): Promise<ConsultationQuestionDTO> {
  const existing = await prisma.kundaliMatchConsultationQuestion.findUnique({
    where: { id: questionId },
  });
  if (!existing) {
    throw new AppError('Question not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  const data: { textNe?: string; isActive?: boolean; sortOrder?: number } = {};
  if (input.textNe !== undefined) data.textNe = input.textNe.trim();
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
  const row = await prisma.kundaliMatchConsultationQuestion.update({
    where: { id: questionId },
    data,
    select: {
      id: true,
      textNe: true,
      sortOrder: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return row;
}

async function renumberConsultationQuestionSortOrders(): Promise<void> {
  const rows = await prisma.kundaliMatchConsultationQuestion.findMany({
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: { id: true },
  });
  if (rows.length === 0) return;
  await prisma.$transaction(
    rows.map((row, index) =>
      prisma.kundaliMatchConsultationQuestion.update({
        where: { id: row.id },
        data: { sortOrder: index + 1 },
      })
    )
  );
}

export async function deleteQuestion(questionId: string): Promise<void> {
  const existing = await prisma.kundaliMatchConsultationQuestion.findUnique({
    where: { id: questionId },
  });
  if (!existing) {
    throw new AppError('Question not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  await prisma.kundaliMatchConsultationQuestion.delete({
    where: { id: questionId },
  });
  await renumberConsultationQuestionSortOrders();
}

export async function reorderQuestions(orderedIds: string[]): Promise<void> {
  if (orderedIds.length !== new Set(orderedIds).size) {
    throw new AppError(
      'Duplicate question IDs are not allowed in the order payload',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }
  const total = await prisma.kundaliMatchConsultationQuestion.count();
  if (orderedIds.length !== total) {
    throw new AppError(
      `You must supply every consultation question ID exactly once (${total} topics in database)`,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }
  const count = await prisma.kundaliMatchConsultationQuestion.count({
    where: { id: { in: orderedIds } },
  });
  if (count !== orderedIds.length) {
    throw new AppError(
      'Invalid question order: one or more IDs are unknown',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.kundaliMatchConsultationQuestion.update({
        where: { id },
        data: { sortOrder: index + 1 },
      })
    )
  );
}

/**
 * Ensures every submitted ID exists and is selectable (active).
 */
export async function assertActiveConsultationQuestionIds(ids: string[]): Promise<void> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) {
    throw new AppError(
      'Select at least one consultation topic',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }
  if (unique.length !== ids.length) {
    throw new AppError(
      'Each consultation topic may only be selected once',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }
  const rows = await prisma.kundaliMatchConsultationQuestion.findMany({
    where: { id: { in: unique }, isActive: true },
    select: { id: true },
  });
  if (rows.length !== unique.length) {
    throw new AppError(
      'One or more consultation topics are invalid or inactive. Refresh and try again.',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }
}
