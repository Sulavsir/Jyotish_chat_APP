import {
  prisma,
  Prisma,
  CoinTransactionReason as DbCoinTransactionReason,
} from '@jyotish/database';
import type { ListAdminPlatformPaymentQuery } from '../validators/adminPlatformPayment.validators';
import { utcDayEnd, utcDayStart } from '../utils/date-range.utils';

export interface AdminPlatformPaymentRow {
  id: string;
  userId: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  paymentId: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  paymentMethod: string | null;
  transactionId: string | null;
}

/**
 * Paginated list of successful platform payments (coin ADD + PAYMENT_SUCCESS).
 * Filters by transaction `createdAt` (when balance was credited) for payment date range.
 */
export async function listAdminPlatformPaymentTransactions(params: ListAdminPlatformPaymentQuery) {
  const { page, limit, search, paymentMethod, paymentDateFrom, paymentDateTo } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.CoinTransactionWhereInput = {
    type: 'ADD',
    reason: DbCoinTransactionReason.PAYMENT_SUCCESS,
  };

  if (paymentDateFrom || paymentDateTo) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (paymentDateFrom) {
      createdAt.gte = utcDayStart(paymentDateFrom);
    }
    if (paymentDateTo) {
      createdAt.lte = utcDayEnd(paymentDateTo);
    }
    where.createdAt = createdAt;
  }

  if (paymentMethod) {
    const paymentsWithMethod = await prisma.payment.findMany({
      where: { paymentMethod },
      select: { id: true },
      take: 50_000,
    });
    const paymentIds = paymentsWithMethod.map((p) => p.id);
    if (paymentIds.length === 0) {
      return {
        transactions: [],
        pagination: { page, limit, total: 0, totalPages: 1 },
      };
    }
    where.paymentId = { in: paymentIds };
  }

  if (search && search.length > 0) {
    const searchLower = search.toLowerCase();
    const [matchingUserIds, matchingPaymentIds] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
        take: 5000,
      }),
      prisma.payment.findMany({
        where: { transactionId: { contains: searchLower, mode: 'insensitive' } },
        select: { id: true },
        take: 5000,
      }),
    ]);
    const userIds = matchingUserIds.map((u) => u.id);
    const paymentIdsFromSearch = matchingPaymentIds.map((p) => p.id);
    const searchConditions: Prisma.CoinTransactionWhereInput[] = [];
    if (userIds.length > 0) searchConditions.push({ userId: { in: userIds } });
    if (paymentIdsFromSearch.length > 0)
      searchConditions.push({ paymentId: { in: paymentIdsFromSearch } });
    if (searchConditions.length > 0) {
      where.AND = [...(Array.isArray(where.AND) ? where.AND : []), { OR: searchConditions }];
    } else {
      return {
        transactions: [],
        pagination: { page, limit, total: 0, totalPages: 1 },
      };
    }
  }

  const [transactions, total] = await Promise.all([
    prisma.coinTransaction.findMany({
      skip,
      take: limit,
      where,
      select: {
        id: true,
        userId: true,
        amount: true,
        balanceBefore: true,
        balanceAfter: true,
        paymentId: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.coinTransaction.count({ where }),
  ]);

  const paymentIds = [...new Set(transactions.map((t) => t.paymentId).filter(Boolean))] as string[];
  const payments =
    paymentIds.length > 0
      ? await prisma.payment.findMany({
          where: { id: { in: paymentIds } },
          select: { id: true, paymentMethod: true, transactionId: true },
        })
      : [];
  const paymentById = new Map(payments.map((p) => [p.id, p]));

  const transactionsWithPayment: AdminPlatformPaymentRow[] = transactions.map((t) => {
    const payment = t.paymentId ? paymentById.get(t.paymentId) : undefined;
    return {
      ...t,
      paymentMethod: payment?.paymentMethod ?? null,
      transactionId: payment?.transactionId ?? null,
    };
  });

  return {
    transactions: transactionsWithPayment,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}
