/**
 * SMS (Aakash) API response types.
 */

export interface SendSMSResponse {
  error: boolean;
  message?: string;
  data?: Array<Record<string, unknown>>;
}
