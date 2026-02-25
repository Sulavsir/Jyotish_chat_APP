/**
 * Fonepay HMAC-SHA512 – message builders and hashing.
 * Callers pass their own secret (QR vs Web must not mix).
 *
 * CRITICAL: DV hash must use EXACT order below. No URL encoding before hashing.
 * Wrong order causes ~90% of Fonepay errors.
 */

import { createHmac } from 'crypto';

/**
 * Compute HMAC-SHA512(secret, message), return hex UPPERCASE.
 * Fonepay expects uppercase DV and does a strict string match.
 */
export function computeHmacSha512(message: string, secret: string): string {
  return createHmac('sha512', secret).update(message).digest('hex').toUpperCase();
}

/** QR: generate QR message – amount,prn,merchantCode,remarks1,remarks2[,taxAmount,taxRefund] */
export function buildGenerateQrMessage(params: {
  amount: string;
  prn: string;
  merchantCode: string;
  remarks1: string;
  remarks2: string;
  taxAmount?: string;
  taxRefund?: string;
}): string {
  const { amount, prn, merchantCode, remarks1, remarks2, taxAmount, taxRefund } = params;
  const base = [amount, prn, merchantCode, remarks1, remarks2].join(',');
  if (taxAmount != null && taxRefund != null) return `${base},${taxAmount},${taxRefund}`;
  return base;
}

/** QR: check-status message – prn,merchantCode */
export function buildCheckStatusMessage(prn: string, merchantCode: string): string {
  return [prn, merchantCode].join(',');
}

/** QR: tax-refund message */
export function buildTaxRefundMessage(params: {
  fonepayTraceId: string;
  merchantPRN: string;
  invoiceNumber: string;
  invoiceDate: string;
  transactionAmount: string;
  merchantCode: string;
}): string {
  const {
    fonepayTraceId,
    merchantPRN,
    invoiceNumber,
    invoiceDate,
    transactionAmount,
    merchantCode,
  } = params;
  return [fonepayTraceId, merchantPRN, invoiceNumber, invoiceDate, transactionAmount, merchantCode].join(',');
}

/** Web Initiate: DV message order MUST be PID,MD,PRN,AMT,CRN,DT,R1,R2,RU. No URL encoding. */
export function buildFonepayWebRequestMessage(params: {
  PID: string;
  MD: string;
  PRN: string;
  AMT: string;
  CRN: string;
  DT: string;
  R1: string;
  R2: string;
  RU: string;
}): string {
  const { PID, MD, PRN, AMT, CRN, DT, R1, R2, RU } = params;
  return [PID, MD, PRN, AMT, CRN, DT, R1, R2, RU].join(',');
}

/** Web Verify: DV message order MUST be PRN,PID,PS,RC,UID,BC,INI,P_AMT,R_AMT. No URL encoding. */
export function buildFonepayWebVerifyMessage(params: {
  PRN: string;
  PID: string;
  PS: string;
  RC: string;
  UID: string;
  BC: string;
  INI: string;
  P_AMT: string;
  R_AMT: string;
}): string {
  const { PRN, PID, PS, RC, UID, BC, INI, P_AMT, R_AMT } = params;
  return [PRN, PID, PS, RC, UID, BC, INI, P_AMT, R_AMT].join(',');
}
