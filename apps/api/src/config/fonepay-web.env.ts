/**
 * Fonepay Web Redirect (card) env – do not mix with Dynamic QR.
 * FONEPAY_WEB_SECRET must never be logged or exposed to frontend.
 */

import { z } from 'zod';

const fonepayWebEnvSchema = z.object({
  FONEPAY_WEB_PID: z.string().min(1, 'FONEPAY_WEB_PID is required'),
  FONEPAY_WEB_SECRET: z.string().min(1, 'FONEPAY_WEB_SECRET is required'),
  FONEPAY_WEB_URL: z
    .string()
    .url()
    .optional()
    .default('https://dev-clientapi.fonepay.com'),
});

export type FonepayWebEnv = z.infer<typeof fonepayWebEnvSchema>;

function parse(): FonepayWebEnv | null {
  const result = fonepayWebEnvSchema.safeParse({
    FONEPAY_WEB_PID: process.env.FONEPAY_WEB_PID,
    FONEPAY_WEB_SECRET: process.env.FONEPAY_WEB_SECRET,
    FONEPAY_WEB_URL: process.env.FONEPAY_WEB_URL,
  });
  return result.success ? result.data : null;
}

let cached: FonepayWebEnv | null | undefined = undefined;

export function getFonepayWebEnv(): FonepayWebEnv | null {
  if (cached === undefined) cached = parse();
  return cached;
}

/** Return URL (RU) for Fonepay callback – must be public HTTPS. From API_URL or BACKEND_PUBLIC_URL. */
export function getFonepayWebReturnUrl(): string {
  const base =
    process.env.FONEPAY_WEB_RETURN_URL ||
    process.env.API_URL ||
    process.env.BACKEND_PUBLIC_URL ||
    'http://localhost:4000';
  return base.replace(/\/$/, '') + '/api/v1/payments/fonepay-card-callback';
}
