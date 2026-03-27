import { Prisma } from '@prisma/client';

/**
 * Unique constraint violation (partial unique index or legacy unique).
 * Prisma code P2002.
 */
export function isPrismaUniqueConstraintViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
