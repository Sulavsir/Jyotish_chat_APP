/**
 * Admin: kundali match consultation catalogue (title + questions).
 */

import { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types';
import { sendSuccess } from '../utils';
import { HTTP_STATUS } from '../constants';
import * as catalogueService from '../services/kundaliMatchConsultationCatalogue.service';

export async function getConsultationCatalogueLookup(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await catalogueService.getConsultationCatalogueLookup();
    return sendSuccess(res, result);
  } catch (e) {
    next(e);
  }
}

export async function listAdminConsultationCataloguePaginated(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as {
      page: number;
      limit: number;
      search?: string;
    };
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const search = typeof query.search === 'string' && query.search.trim() ? query.search.trim() : undefined;

    const result = await catalogueService.listConsultationCataloguePaginated({ page, limit, search });
    return sendSuccess(res, result);
  } catch (e) {
    next(e);
  }
}

export async function updateTitle(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { titleNe } = req.body as { titleNe: string };
    const trimmed = await catalogueService.updateConsultationTitleNe(titleNe);
    return sendSuccess(res, { titleNe: trimmed });
  } catch (e) {
    next(e);
  }
}

export async function createQuestion(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { textNe, sortOrder } = req.body as {
      textNe: string;
      sortOrder?: number;
    };
    const row = await catalogueService.createQuestion({ textNe, sortOrder });
    return sendSuccess(res, { question: row }, HTTP_STATUS.CREATED);
  } catch (e) {
    next(e);
  }
}

export async function updateQuestion(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { questionId } = req.params;
    const body = req.body as {
      textNe?: string;
      isActive?: boolean;
      sortOrder?: number;
    };
    const row = await catalogueService.updateQuestion(questionId, body);
    return sendSuccess(res, { question: row });
  } catch (e) {
    next(e);
  }
}

export async function deleteQuestion(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { questionId } = req.params;
    await catalogueService.deleteQuestion(questionId);
    return sendSuccess(res, { ok: true });
  } catch (e) {
    next(e);
  }
}

export async function moveQuestion(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { questionId } = req.params;
    const { direction } = req.body as { direction: 'up' | 'down' };
    await catalogueService.moveQuestionRelative(questionId, direction);
    return sendSuccess(res, { ok: true });
  } catch (e) {
    next(e);
  }
}

export async function reorderQuestions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { orderedIds } = req.body as { orderedIds: string[] };
    await catalogueService.reorderQuestions(orderedIds);
    return sendSuccess(res, { ok: true });
  } catch (e) {
    next(e);
  }
}
