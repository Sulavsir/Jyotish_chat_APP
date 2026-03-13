/**
 * Fonepay Dynamic QR – one of two separate Fonepay gateways.
 * Uses FONEPAY_QR_* env only. Do not mix with Web redirect.
 *
 * Live URLs (from Fonepay docs):
 * - QR Generate: https://merchantapi.fonepay.com/api/merchant/merchantDetailsForThirdParty/thirdPartyDynamicQrDownload
 * - Check Status: https://merchantapi.fonepay.com/api/merchant/merchantDetailsForThirdParty/thirdPartyDynamicQrGetStatus
 * - WebSocket: wss://ws.fonepay.com/convergent-webSocket-web/merchantEndPoint
 */

export { generateQr } from './generateQr';
export {
  checkStatus,
  updateTransactionStatus,
  handleWebSocketPaymentResult,
  handleWebSocketQrVerified,
} from './checkStatus';
export { postTaxRefund } from './taxRefund';
export {
  getFonepayQrWebSocketBase,
  parseWebSocketMessage,
  parseTransactionStatus,
  isQrVerificationMessage,
  isPaymentResultMessage,
  getPaymentOutcome,
} from './websocket';
export * from './constants';
