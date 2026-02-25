/**
 * Fonepay Dynamic QR – WebSocket base URL for client.
 * Backend only provides the URL; frontend connects and listens for payment result.
 */

import { getFonepayQrEnv } from '../../../config/fonepay-qr.env';

export function getFonepayQrWebSocketBase(): string {
  const env = getFonepayQrEnv();
  return env?.FONEPAY_QR_WS_BASE ?? 'wss://dev-ws.fonepay.com/convergent-webSocket-web';
}
