/**
 * Questionnaire Service
 * Manages question categories and their questions
 */

import { prisma, Prisma, QuestionnaireLanguage } from '@jyotish/database';
import { AppError, ERROR_CODES, HTTP_STATUS } from '../utils';

/** Category with questions included (matches Prisma findMany with include) */
type QuestionCategoryWithQuestions = Prisma.QuestionCategoryGetPayload<{
  include: { questions: true };
}>;

type ListInput = {
  page?: number;
  limit?: number;
  search?: string;
  language?: string;
  includeInactive?: boolean;
};

type ListResult = {
  items: QuestionCategoryWithQuestions[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const questionCategoryDelegate = prisma.questionCategory;
const questionItemDelegate = prisma.questionItem;

export const questionnaireService = {
  async listPublic(language?: string): Promise<QuestionCategoryWithQuestions[]> {
    const lang: QuestionnaireLanguage =
      language && ['NEPALI', 'HINDI', 'ENGLISH'].includes(language)
        ? (language as QuestionnaireLanguage)
        : QuestionnaireLanguage.ENGLISH;
    return questionCategoryDelegate.findMany({
      where: { isActive: true, language: lang },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        questions: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });
  },

  async listAdmin(input?: ListInput): Promise<ListResult> {
    const page = input?.page && input.page > 0 ? input.page : 1;
    const limit = input?.limit && input.limit > 0 && input.limit <= 100 ? input.limit : 10;
    const skip = (page - 1) * limit;
    const q = input?.search?.trim();

    const where: Prisma.QuestionCategoryWhereInput = {};

    if (!input?.includeInactive) {
      where.isActive = true;
    }

    if (q) {
      where.name = { contains: q, mode: 'insensitive' };
    }

    if (input?.language && ['NEPALI', 'HINDI', 'ENGLISH'].includes(input.language)) {
      where.language = input.language as QuestionnaireLanguage;
    }

    const [items, total] = await Promise.all([
      questionCategoryDelegate.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        skip,
        take: limit,
        include: {
          questions: {
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          },
        },
      }),
      questionCategoryDelegate.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  async create(input: {
    name: string;
    emoji?: string;
    language?: string;
    isActive?: boolean;
    sortOrder?: number;
    questions: string[];
  }): Promise<QuestionCategoryWithQuestions> {
    const lang: QuestionnaireLanguage =
      input.language && ['NEPALI', 'HINDI', 'ENGLISH'].includes(input.language)
        ? (input.language as QuestionnaireLanguage)
        : QuestionnaireLanguage.ENGLISH;
    const created = await questionCategoryDelegate.create({
      data: {
        name: input.name,
        emoji: input.emoji ?? null,
        language: lang,
        isActive: input.isActive ?? true,
        sortOrder: input.sortOrder ?? 0,
        questions: {
          create: input.questions.map((text, index) => ({
            text,
            sortOrder: index,
          })),
        },
      },
      include: {
        questions: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    return created;
  },

  async update(
    id: string,
    input: {
      name?: string;
      emoji?: string;
      language?: string;
      isActive?: boolean;
      sortOrder?: number;
      questions?: string[];
    }
  ): Promise<QuestionCategoryWithQuestions> {
    const existing = await questionCategoryDelegate.findUnique({
      where: { id },
      include: { questions: true },
    });

    if (!existing) {
      throw new AppError(
        'Question category not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.NOT_FOUND
      );
    }

    // If questions are provided, replace the existing set with the new ordered list
    if (input.questions) {
      await questionItemDelegate.deleteMany({
        where: { categoryId: id },
      });

      await questionItemDelegate.createMany({
        data: input.questions.map((text, index) => ({
          categoryId: id,
          text,
          sortOrder: index,
          isActive: true,
        })),
      });
    }

    const lang: QuestionnaireLanguage | undefined =
      input.language !== undefined && ['NEPALI', 'HINDI', 'ENGLISH'].includes(input.language)
        ? (input.language as QuestionnaireLanguage)
        : undefined;
    const updated = await questionCategoryDelegate.update({
      where: { id },
      data: {
        name: input.name ?? undefined,
        emoji: input.emoji !== undefined ? input.emoji : undefined,
        ...(lang !== undefined && { language: lang }),
        isActive: input.isActive ?? undefined,
        sortOrder: input.sortOrder ?? undefined,
      },
      include: {
        questions: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    return updated as QuestionCategoryWithQuestions;
  },

  async remove(id: string): Promise<void> {
    const existing = await questionCategoryDelegate.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(
        'Question category not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.NOT_FOUND
      );
    }

    await questionCategoryDelegate.delete({ where: { id } });
  },
};
