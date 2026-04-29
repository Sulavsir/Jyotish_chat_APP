import {
  prisma,
  AstrologerCategory as PrismaAstrologerCategory,
  Prisma,
} from '@jyotish/database';
import { AppError } from '../middleware/error-handler';
import { ERROR_CODES, HTTP_STATUS } from '../constants';

const ASSIGNEE_ASTROLOGER_SELECT = {
  id: true,
  name: true,
  phone: true,
  email: true,
  category: true,
  inhouseAstrologer: true,
  isActive: true,
  isDeleted: true,
  isOnline: true,
} as const;

const assigneePriorityInclude = {
  astrologer: { select: ASSIGNEE_ASTROLOGER_SELECT },
} satisfies Prisma.BroadcastAssigneePriorityInclude;

type Tx = Prisma.TransactionClient;

async function loadOrderedRows(tx: Tx) {
  return tx.broadcastAssigneePriority.findMany({
    orderBy: [{ priority: 'asc' }, { id: 'asc' }],
  });
}

/** Apply sequential priorities 1..n to match `orderedAstrologerIds` order. */
async function applySequentialPriorities(tx: Tx, orderedAstrologerIds: string[]) {
  for (let i = 0; i < orderedAstrologerIds.length; i++) {
    await tx.broadcastAssigneePriority.update({
      where: { astrologerId: orderedAstrologerIds[i] },
      data: { priority: i + 1 },
    });
  }
}

function clampInsertIndex(requestedOneBased: number, length: number) {
  const p = Math.floor(requestedOneBased);
  if (!Number.isFinite(p)) return 0;
  return Math.min(Math.max(0, p - 1), length);
}

function isAssignableBroadcastAstrologer(a: {
  inhouseAstrologer: boolean;
  isActive: boolean;
  isDeleted: boolean;
  category: PrismaAstrologerCategory;
}): boolean {
  if (!a.inhouseAstrologer || !a.isActive || a.isDeleted) return false;
  if (a.category === PrismaAstrologerCategory.PREMIUM) return false;
  return (
    a.category === PrismaAstrologerCategory.ORDINARY ||
    a.category === PrismaAstrologerCategory.PROFESSIONAL
  );
}

/**
 * Ordered astrologer IDs for timer-based auto-assignment: admin priority rows first (by `priority` asc),
 * then remaining eligible in-house ordinary/professional jyotish (name asc).
 *
 * **Offline jyotish are included on purpose** so when the broadcast timer ends, the server can still
 * assign to the priority list (or fallback list) even if no one is currently `isOnline`. Manual accept
 * from the live pending bar still typically requires the astrologer to be using the app; this list is
 * only for `acceptBroadcastMessage` during `expireOldMessages` / auto-assign.
 */
export async function getAutoAssignCandidateAstrologerIdsOrdered(): Promise<string[]> {
  const priorityRows = await prisma.broadcastAssigneePriority.findMany({
    orderBy: { priority: 'asc' },
    include: {
      astrologer: {
        select: {
          id: true,
          category: true,
          inhouseAstrologer: true,
          isActive: true,
          isDeleted: true,
        },
      },
    },
  });

  const priorityIds: string[] = [];
  for (const row of priorityRows) {
    const a = row.astrologer;
    if (a && isAssignableBroadcastAstrologer(a)) {
      priorityIds.push(a.id);
    }
  }

  const allEligible = await prisma.astrologer.findMany({
    where: {
      isActive: true,
      isDeleted: false,
      inhouseAstrologer: true,
      category: {
        in: [PrismaAstrologerCategory.ORDINARY, PrismaAstrologerCategory.PROFESSIONAL],
      },
    },
    select: { id: true },
    orderBy: { name: 'asc' },
  });

  const seen = new Set(priorityIds);
  const fallback = allEligible.map((x) => x.id).filter((id) => !seen.has(id));

  return [...priorityIds, ...fallback];
}

export async function listBroadcastAssigneePrioritiesForAdmin() {
  return prisma.broadcastAssigneePriority.findMany({
    orderBy: [{ priority: 'asc' }, { id: 'asc' }],
    include: assigneePriorityInclude,
  });
}

export async function createBroadcastAssigneePriority(astrologerId: string, priority: number) {
  const astro = await prisma.astrologer.findUnique({
    where: { id: astrologerId },
    select: {
      id: true,
      inhouseAstrologer: true,
      isDeleted: true,
      isActive: true,
      category: true,
      name: true,
    },
  });

  if (!astro || astro.isDeleted || !astro.isActive) {
    throw new AppError('Jyotish not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  if (!isAssignableBroadcastAstrologer(astro)) {
    throw new AppError(
      'Only active in-house Ordinary or Professional jyotish can be added to the priority list.',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const rows = await loadOrderedRows(tx);
      if (rows.some((r) => r.astrologerId === astrologerId)) {
        throw new AppError(
          'This jyotish is already on the priority list. Remove or update the existing entry.',
          HTTP_STATUS.CONFLICT,
          ERROR_CODES.VALIDATION_ERROR
        );
      }

      const ids = rows.map((r) => r.astrologerId);
      const insertAt = clampInsertIndex(priority, ids.length);
      const newOrder = [...ids.slice(0, insertAt), astrologerId, ...ids.slice(insertAt)];

      await tx.broadcastAssigneePriority.create({
        data: {
          astrologerId,
          priority: newOrder.length + 1_000_000,
        },
      });

      await applySequentialPriorities(tx, newOrder);

      const created = await tx.broadcastAssigneePriority.findUnique({
        where: { astrologerId },
        include: assigneePriorityInclude,
      });
      if (!created) {
        throw new AppError(
          'Failed to load priority entry after create',
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          ERROR_CODES.SERVER_ERROR
        );
      }
      return created;
    });
  } catch (e: unknown) {
    if (e instanceof AppError) throw e;
    const err = e as { code?: string };
    if (err.code === 'P2002') {
      throw new AppError(
        'This jyotish is already on the priority list. Remove or update the existing entry.',
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    throw e;
  }
}

export async function updateBroadcastAssigneePriority(
  id: string,
  patch: { astrologerId?: string; priority?: number }
) {
  try {
    return await prisma.$transaction(async (tx) => {
      let rows = await loadOrderedRows(tx);
      let idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) {
        throw new AppError('Priority entry not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
      }

      if (patch.astrologerId !== undefined && patch.astrologerId !== rows[idx].astrologerId) {
        const astro = await prisma.astrologer.findUnique({
          where: { id: patch.astrologerId },
          select: {
            id: true,
            inhouseAstrologer: true,
            isDeleted: true,
            isActive: true,
            category: true,
          },
        });
        if (!astro || astro.isDeleted || !astro.isActive) {
          throw new AppError('Jyotish not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
        }
        if (!isAssignableBroadcastAstrologer(astro)) {
          throw new AppError(
            'Only active in-house Ordinary or Professional jyotish can be on the priority list.',
            HTTP_STATUS.BAD_REQUEST,
            ERROR_CODES.VALIDATION_ERROR
          );
        }
        const duplicate = rows.some(
          (r, i) => r.astrologerId === patch.astrologerId && i !== idx
        );
        if (duplicate) {
          throw new AppError(
            'Another entry already uses this jyotish.',
            HTTP_STATUS.CONFLICT,
            ERROR_CODES.VALIDATION_ERROR
          );
        }
        await tx.broadcastAssigneePriority.update({
          where: { id },
          data: { astrologerId: patch.astrologerId },
        });
        rows = await loadOrderedRows(tx);
        idx = rows.findIndex((r) => r.id === id);
      }

      if (patch.priority !== undefined) {
        rows = await loadOrderedRows(tx);
        const ids = rows.map((r) => r.astrologerId);
        const curIdx = rows.findIndex((r) => r.id === id);
        const [moved] = ids.splice(curIdx, 1);
        const insertAt = clampInsertIndex(patch.priority, ids.length);
        ids.splice(insertAt, 0, moved);
        await applySequentialPriorities(tx, ids);
      }

      const updated = await tx.broadcastAssigneePriority.findUnique({
        where: { id },
        include: assigneePriorityInclude,
      });
      if (!updated) {
        throw new AppError('Priority entry not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
      }
      return updated;
    });
  } catch (e: unknown) {
    if (e instanceof AppError) throw e;
    const err = e as { code?: string };
    if (err.code === 'P2002') {
      throw new AppError(
        'Another entry already uses this jyotish.',
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    throw e;
  }
}

export async function deleteBroadcastAssigneePriority(id: string) {
  try {
    await prisma.$transaction(async (tx) => {
      const row = await tx.broadcastAssigneePriority.findUnique({ where: { id } });
      if (!row) {
        throw new AppError('Priority entry not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
      }
      await tx.broadcastAssigneePriority.delete({ where: { id } });
      const remaining = await loadOrderedRows(tx);
      const ids = remaining.map((r) => r.astrologerId);
      await applySequentialPriorities(tx, ids);
    });
  } catch (e: unknown) {
    if (e instanceof AppError) throw e;
    const err = e as { code?: string };
    if (err.code === 'P2025') {
      throw new AppError('Priority entry not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    throw e;
  }
}
