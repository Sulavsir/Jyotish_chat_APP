/**
 * Admin report: broadcast (Everyone Jyotish) + direct (1:1) chat activity per astrologer
 *
 * Direct includes: (1) accepted instant-chat requests and (2) ad-hoc / mixed chats: any client↔jyotish
 * thread with no accepted broadcast, OR with at least one message before the first broadcast
 * acceptance (so direct-then-broadcast on the same chat still counts as direct).
 */

import {
  prisma,
  BroadcastMessageStatus,
  InstantChatRequestStatus,
  ParticipantType,
  Prisma,
} from '@jyotish/database';

export type AstrologerChatAcceptanceReportRow = {
  astrologerId: string;
  name: string;
  email: string | null;
  phone: string;
  category: string;
  broadcastAcceptedCount: number;
  directChatAcceptedCount: number;
};

export type ListAstrologerChatAcceptanceReportParams = {
  from?: Date;
  to?: Date;
  search?: string;
  page: number;
  limit: number;
  sortBy:
    | 'broadcastAcceptedCount'
    | 'directChatAcceptedCount'
    | 'totalAcceptances'
    | 'name';
  sortOrder: 'asc' | 'desc';
};

export type ListAstrologerChatAcceptanceReportResult = {
  rows: AstrologerChatAcceptanceReportRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  periodTotals: {
    broadcastAccepted: number;
    directChatAccepted: number;
  };
};

function buildBroadcastWhere(
  from?: Date,
  to?: Date
): Prisma.BroadcastMessageWhereInput {
  const acceptedAt: Prisma.DateTimeNullableFilter =
    from || to
      ? {
          not: null,
          ...(from ? { gte: from } : {}),
          ...(to ? { lte: to } : {}),
        }
      : { not: null };

  return {
    status: BroadcastMessageStatus.ACCEPTED,
    acceptedBy: { not: null },
    acceptedAt,
  };
}

/** Chats whose created / last-message / end time overlaps the report window (for instant + ad-hoc). */
function chatTouchesReportingPeriodWhere(
  from?: Date,
  to?: Date
): Prisma.ChatWhereInput | null {
  if (!from && !to) return null;
  const or: Prisma.ChatWhereInput[] = [];
  if (from && to) {
    or.push({ createdAt: { gte: from, lte: to } });
    or.push({ lastMessageAt: { not: null, gte: from, lte: to } });
    or.push({ endedAt: { not: null, gte: from, lte: to } });
  } else if (from) {
    or.push({ createdAt: { gte: from } });
    or.push({ lastMessageAt: { not: null, gte: from } });
    or.push({ endedAt: { not: null, gte: from } });
  } else if (to) {
    or.push({ createdAt: { lte: to } });
    or.push({ lastMessageAt: { not: null, lte: to } });
    or.push({ endedAt: { not: null, lte: to } });
  }
  return { OR: or };
}

/**
 * Instant-chat rows: accept timestamp in range, or chat thread touched the range (InstantChatRequest
 * has no Prisma relation to Chat — use chatId IN (...)).
 */
function buildInstantWhere(
  from: Date | undefined,
  to: Date | undefined,
  chatIdsTouchingPeriod: string[]
): Prisma.InstantChatRequestWhereInput {
  const base: Prisma.InstantChatRequestWhereInput = {
    status: InstantChatRequestStatus.ACCEPTED,
    acceptedBy: { not: null },
    chatId: { not: null },
  };

  if (!from && !to) {
    return base;
  }

  const bounds = {
    ...(from ? { gte: from } : {}),
    ...(to ? { lte: to } : {}),
  };

  const or: Prisma.InstantChatRequestWhereInput[] = [
    { acceptedAt: { not: null, ...bounds } },
    { acceptedAt: null, updatedAt: bounds },
  ];
  if (chatIdsTouchingPeriod.length > 0) {
    or.push({ chatId: { in: chatIdsTouchingPeriod } });
  }

  return { ...base, OR: or };
}

/**
 * Ad-hoc / mixed direct chats: no accepted broadcast, OR chat had messages before the first
 * broadcast acceptance (same thread as UI “Direct” then “Broadcast”).
 */
function adHocDirectChatsSql(from?: Date, to?: Date): Prisma.Sql {
  const dateClause =
    !from && !to
      ? Prisma.empty
      : from && to
        ? Prisma.sql`AND (
            (c."createdAt" >= ${from} AND c."createdAt" <= ${to})
            OR (c."lastMessageAt" IS NOT NULL AND c."lastMessageAt" >= ${from} AND c."lastMessageAt" <= ${to})
            OR (c."endedAt" IS NOT NULL AND c."endedAt" >= ${from} AND c."endedAt" <= ${to})
          )`
        : from
          ? Prisma.sql`AND (
            (c."createdAt" >= ${from})
            OR (c."lastMessageAt" IS NOT NULL AND c."lastMessageAt" >= ${from})
            OR (c."endedAt" IS NOT NULL AND c."endedAt" >= ${from})
          )`
          : Prisma.sql`AND (
            (c."createdAt" <= ${to!})
            OR (c."lastMessageAt" IS NOT NULL AND c."lastMessageAt" <= ${to!})
            OR (c."endedAt" IS NOT NULL AND c."endedAt" <= ${to!})
          )`;

  return Prisma.sql`
    SELECT c.id, c."participant2Id"
    FROM "Chat" c
    WHERE c."participant2Type" = 'ASTROLOGER'
      AND (
        NOT EXISTS (
          SELECT 1 FROM "BroadcastMessage" b
          WHERE b."chatId" = c.id
            AND b.status = 'ACCEPTED'
        )
        OR EXISTS (
          SELECT 1 FROM "Message" m
          WHERE m."chatId" = c.id
            AND m."isDeleted" = false
            AND m."createdAt" < (
              SELECT MIN(b2."acceptedAt")
              FROM "BroadcastMessage" b2
              WHERE b2."chatId" = c.id
                AND b2.status = 'ACCEPTED'
                AND b2."acceptedAt" IS NOT NULL
            )
        )
      )
    ${dateClause}
  `;
}

function mergeDirectChatIdsPerAstrologer(
  instantRows: { acceptedBy: string | null; chatId: string | null }[],
  adHocChats: { id: string; participant2Id: string }[]
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();

  const add = (astroId: string | null | undefined, chatId: string | null | undefined) => {
    if (!astroId || !chatId) return;
    let set = map.get(astroId);
    if (!set) {
      set = new Set();
      map.set(astroId, set);
    }
    set.add(chatId);
  };

  for (const r of instantRows) {
    add(r.acceptedBy, r.chatId);
  }
  for (const c of adHocChats) {
    add(c.participant2Id, c.id);
  }

  return map;
}

export async function listAstrologerChatAcceptanceReport(
  params: ListAstrologerChatAcceptanceReportParams
): Promise<ListAstrologerChatAcceptanceReportResult> {
  const { from, to, search, page, limit, sortBy, sortOrder } = params;
  const broadcastWhere = buildBroadcastWhere(from, to);

  const chatPeriodWhere = chatTouchesReportingPeriodWhere(from, to);
  let chatIdsTouchingPeriod: string[] = [];
  if (chatPeriodWhere) {
    const hits = await prisma.chat.findMany({
      where: {
        participant2Type: ParticipantType.ASTROLOGER,
        ...chatPeriodWhere,
      },
      select: { id: true },
    });
    chatIdsTouchingPeriod = hits.map((h) => h.id);
  }

  const instantWhere = buildInstantWhere(from, to, chatIdsTouchingPeriod);

  const [periodBroadcastTotal, broadcastGrouped, instantRows, adHocChats] = await Promise.all([
    prisma.broadcastMessage.count({ where: broadcastWhere }),
    prisma.broadcastMessage.groupBy({
      by: ['acceptedBy'],
      where: broadcastWhere,
      _count: { _all: true },
    }),
    prisma.instantChatRequest.findMany({
      where: instantWhere,
      select: { acceptedBy: true, chatId: true },
    }),
    prisma.$queryRaw<Array<{ id: string; participant2Id: string }>>(adHocDirectChatsSql(from, to)),
  ]);

  const directSets = mergeDirectChatIdsPerAstrologer(instantRows, adHocChats);
  const directCounts = new Map<string, number>();
  for (const [astroId, set] of directSets) {
    directCounts.set(astroId, set.size);
  }

  const periodDirectChatIds = new Set<string>();
  for (const r of instantRows) {
    if (r.chatId) periodDirectChatIds.add(r.chatId);
  }
  for (const c of adHocChats) {
    periodDirectChatIds.add(c.id);
  }
  const periodDirectTotal = periodDirectChatIds.size;

  const broadcastCounts = new Map(
    broadcastGrouped
      .filter((g): g is typeof g & { acceptedBy: string } => g.acceptedBy != null)
      .map((g) => [g.acceptedBy, g._count._all])
  );

  const astrologerIds = [
    ...new Set([...broadcastCounts.keys(), ...directCounts.keys()]),
  ];

  if (astrologerIds.length === 0) {
    return {
      rows: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
      periodTotals: {
        broadcastAccepted: periodBroadcastTotal,
        directChatAccepted: periodDirectTotal,
      },
    };
  }

  const astrologers = await prisma.astrologer.findMany({
    where: { id: { in: astrologerIds } },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      category: true,
    },
  });

  const astroById = new Map(astrologers.map((a) => [a.id, a]));

  const rows: AstrologerChatAcceptanceReportRow[] = [];

  for (const id of astrologerIds) {
    const broadcastAcceptedCount = broadcastCounts.get(id) ?? 0;
    const directChatAcceptedCount = directCounts.get(id) ?? 0;
    const a = astroById.get(id);
    if (a) {
      rows.push({
        astrologerId: a.id,
        name: a.name,
        email: a.email,
        phone: a.phone,
        category: a.category,
        broadcastAcceptedCount,
        directChatAcceptedCount,
      });
    } else {
      rows.push({
        astrologerId: id,
        name: 'Unknown / deleted astrologer',
        email: null,
        phone: '—',
        category: '—',
        broadcastAcceptedCount,
        directChatAcceptedCount,
      });
    }
  }

  let filtered = rows;
  if (search) {
    const q = search.toLowerCase();
    filtered = rows.filter((r) => {
      const email = r.email?.toLowerCase() ?? '';
      return (
        r.name.toLowerCase().includes(q) ||
        email.includes(q) ||
        r.phone.toLowerCase().includes(q)
      );
    });
  }

  const totalActivity = (r: AstrologerChatAcceptanceReportRow) =>
    r.broadcastAcceptedCount + r.directChatAcceptedCount;

  filtered.sort((a, b) => {
    if (sortBy === 'name') {
      const cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      if (cmp !== 0) return sortOrder === 'asc' ? cmp : -cmp;
      return sortOrder === 'asc'
        ? totalActivity(a) - totalActivity(b)
        : totalActivity(b) - totalActivity(a);
    }
    if (sortBy === 'directChatAcceptedCount') {
      const cmp = a.directChatAcceptedCount - b.directChatAcceptedCount;
      if (cmp !== 0) return sortOrder === 'asc' ? cmp : -cmp;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    }
    if (sortBy === 'totalAcceptances') {
      const cmp = totalActivity(a) - totalActivity(b);
      if (cmp !== 0) return sortOrder === 'asc' ? cmp : -cmp;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    }
    const cmp = a.broadcastAcceptedCount - b.broadcastAcceptedCount;
    if (cmp !== 0) return sortOrder === 'asc' ? cmp : -cmp;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });

  const total = filtered.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const skip = (page - 1) * limit;
  const pagedRows = filtered.slice(skip, skip + limit);

  return {
    rows: pagedRows,
    pagination: { page, limit, total, totalPages },
    periodTotals: {
      broadcastAccepted: periodBroadcastTotal,
      directChatAccepted: periodDirectTotal,
    },
  };
}
