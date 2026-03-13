/**
 * Fonepay Dynamic QR env 
 * - Base API: https://merchantapi.fonepay.com/api
 * - WebSocket: wss://ws.fonepay.com/convergent-webSocket-web/merchantEndPoint
 */

import { z } from 'zod';

const fonepayQrEnvSchema = z.object({
  FONEPAY_QR_USERNAME: z.string().min(1, 'FONEPAY_QR_USERNAME is required'),
  FONEPAY_QR_PASSWORD: z.string().min(1, 'FONEPAY_QR_PASSWORD is required'),
  FONEPAY_QR_MERCHANT_CODE: z.string().min(1, 'FONEPAY_QR_MERCHANT_CODE is required'),
  FONEPAY_QR_SECRET: z.string().min(1, 'FONEPAY_QR_SECRET is required'),
  FONEPAY_QR_BASE_URL: z
    .string()
    .url()
    .optional()
    .default('https://merchantapi.fonepay.com/api'),
  FONEPAY_QR_WS_BASE: z
    .string()
    .optional()
    .default('wss://ws.fonepay.com/convergent-webSocket-web/merchantEndPoint'),
});

export type FonepayQrEnv = z.infer<typeof fonepayQrEnvSchema>;

function parse(): FonepayQrEnv | null {
  const result = fonepayQrEnvSchema.safeParse({
    FONEPAY_QR_USERNAME: process.env.FONEPAY_QR_USERNAME,
    FONEPAY_QR_PASSWORD: process.env.FONEPAY_QR_PASSWORD,
    FONEPAY_QR_MERCHANT_CODE: process.env.FONEPAY_QR_MERCHANT_CODE,
    FONEPAY_QR_SECRET: process.env.FONEPAY_QR_SECRET,
    FONEPAY_QR_BASE_URL: process.env.FONEPAY_QR_BASE_URL,
    FONEPAY_QR_WS_BASE: process.env.FONEPAY_QR_WS_BASE,
  });
  return result.success ? result.data : null;
}

let cached: FonepayQrEnv | null | undefined = undefined;

export function getFonepayQrEnv(): FonepayQrEnv | null {
  if (cached === undefined) cached = parse();
  return cached;
}
