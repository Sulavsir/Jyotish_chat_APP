/**
 * Platform admin panel roles (Admin table — not UserRole.ADMIN).
 * JWT includes this for admin sessions so API can enforce scope without a DB round-trip per request.
 */
export enum AdminRole {
  /** Full access to all admin routes and financial data. */
  FULL = 'FULL',
  /**
   * Same as FULL except: no payment history, earnings, add-balance APIs; no payment/earnings dashboard nav.
   */
  USER_SUPPORT = 'USER_SUPPORT',
}
