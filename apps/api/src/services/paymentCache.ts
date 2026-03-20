import { PaymentStatus } from '../constants/payment.constants';

const MY_PAYMENTS_CACHE_TTL_MS = 2500;

export interface SuccessfulPaymentItem {
  id: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId: string | null;
  status: PaymentStatus;
  createdAt: Date;
  metadata: unknown;
}

export interface MySuccessfulPaymentsResponse {
  payments: SuccessfulPaymentItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const mySuccessfulPaymentsCache = new Map<string, CacheEntry<MySuccessfulPaymentsResponse>>();

export function makeMySuccessfulPaymentsCacheKey(userId: string, page: number, limit: number): string {
  return `my-payments:${userId}:success:${page}:${limit}`;
}

export function getMySuccessfulPaymentsCache(key: string): MySuccessfulPaymentsResponse | null {
  const entry = mySuccessfulPaymentsCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    mySuccessfulPaymentsCache.delete(key);
    return null;
  }
  return entry.value;
}

export function setMySuccessfulPaymentsCache(key: string, value: MySuccessfulPaymentsResponse): void {
  mySuccessfulPaymentsCache.set(key, {
    value,
    expiresAt: Date.now() + MY_PAYMENTS_CACHE_TTL_MS,
  });
}

export function invalidateMySuccessfulPaymentsCache(userId: string): void {
  const prefix = `my-payments:${userId}:success:`;
  for (const key of mySuccessfulPaymentsCache.keys()) {
    if (key.startsWith(prefix)) mySuccessfulPaymentsCache.delete(key);
  }
}

