/**
 * Request utilities
 * Shared helpers for extracting client info from Express requests (e.g. behind proxies)
 */

import { Request } from 'express';

/**
 * Get the client IP from the request.
 * Uses X-Forwarded-For (first entry), X-Real-IP, then req.ip (when trust proxy is set), then socket.
 * Trims whitespace and normalizes IPv4-mapped IPv6 (::ffff:1.2.3.4 -> 1.2.3.4).
 */
export function getClientIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  const first =
    typeof forwarded === 'string'
      ? forwarded.split(',')[0]?.trim()
      : Array.isArray(forwarded)
        ? forwarded[0]?.trim()
        : undefined;
  const raw = first || (req.headers['x-real-ip'] as string) || req.ip || req.socket?.remoteAddress;
  if (!raw) return undefined;
  if (raw.startsWith('::ffff:')) return raw.slice(7);
  return raw;
}
