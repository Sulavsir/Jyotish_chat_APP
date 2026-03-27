/**
 * Prisma filters for client (User) rows that are not soft-deleted.
 */
export const ACTIVE_CLIENT_USER_WHERE = { isDeleted: false } as const;
