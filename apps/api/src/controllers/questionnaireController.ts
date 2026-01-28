/**
 * Questionnaire Controller
 * Handles question categories and questions for both public and admin APIs
 */

import type { Request, Response } from 'express';
import { questionnaireService } from '../services/questionnaire.service';
import type { QuestionnaireCategory } from '@jyotish/shared';

export const listPublicQuestionnaires = async (_req: Request, res: Response) => {
  const categories = await questionnaireService.listPublic();

  // Shape response using shared types
  const data: QuestionnaireCategory[] = categories.map((category) => ({
    id: category.id,
    name: category.name,
    emoji: category.emoji,
    isActive: category.isActive,
    sortOrder: category.sortOrder,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
    questions: category.questions.map((question) => ({
      id: question.id,
      categoryId: question.categoryId,
      text: question.text,
      isActive: question.isActive,
      sortOrder: question.sortOrder,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    })),
  }));

  res.json({
    success: true,
    data: {
      categories: data,
    },
  });
};

export const listAdminQuestionnaires = async (req: Request, res: Response) => {
  const { page, limit, search, includeInactive } = req.query;

  const pageNumber = page ? Number(page) : undefined;
  const limitNumber = limit ? Number(limit) : undefined;
  const includeInactiveFlag =
    typeof includeInactive === 'string' ? includeInactive === 'true' : undefined;

  const result = await questionnaireService.listAdmin({
    page: pageNumber,
    limit: limitNumber,
    search: typeof search === 'string' ? search : undefined,
    includeInactive: includeInactiveFlag,
  });

  res.json({
    success: true,
    data: {
      categories: result.items,
      pagination: result.pagination,
    },
  });
};

export const createQuestionCategory = async (req: Request, res: Response) => {
  const { name, emoji, isActive, sortOrder, questions } = req.body as {
    name: string;
    emoji?: string;
    isActive?: boolean;
    sortOrder?: number;
    questions: string[];
  };

  const created = await questionnaireService.create({
    name,
    emoji,
    isActive,
    sortOrder,
    questions,
  });

  res.status(201).json({
    success: true,
    data: {
      category: created,
    },
  });
};

export const updateQuestionCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, emoji, isActive, sortOrder, questions } = req.body as {
    name?: string;
    emoji?: string;
    isActive?: boolean;
    sortOrder?: number;
    questions?: string[];
  };

  const updated = await questionnaireService.update(id, {
    name,
    emoji,
    isActive,
    sortOrder,
    questions,
  });

  res.json({
    success: true,
    data: {
      category: updated,
    },
  });
};

export const removeQuestionCategory = async (req: Request, res: Response) => {
  const { id } = req.params;

  await questionnaireService.remove(id);

  res.json({
    success: true,
    data: {
      message: 'Question category deleted successfully',
    },
  });
};

