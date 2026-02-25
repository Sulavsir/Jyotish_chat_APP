'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type {
  WebSocketVerificationMsg,
  WebSocketPaymentMsg,
  FonepayTransactionStatusPayload,
} from '@/types/fonepay.types';

export type FonepayWsEvent =
  | { type: 'verified' }
  | { type: 'payment_success'; fonepayTraceId?: string }
  | { type: 'payment_failed' }
  | { type: 'close' }
  | { type: 'error'; message: string };

const MAX_RECONNECT_ATTEMPTS = 3;
const INITIAL_RECONNECT_DELAY_MS = 1000;

/**
 * Parse WebSocket message and detect verification or payment result.
 */
function parseWsMessage(data: string): FonepayWsEvent | null {
  try {
    const msg = JSON.parse(data) as WebSocketVerificationMsg & WebSocketPaymentMsg;
    const status = msg.transactionStatus;

    if (msg.qrVerified === true || (typeof status === 'string' && status.toUpperCase() === 'VERIFIED')) {
      return { type: 'verified' };
    }

    if (typeof status === 'string') {
      try {
        const payload = JSON.parse(status) as FonepayTransactionStatusPayload;
        if (payload.paymentSuccess === true) {
          return { type: 'payment_success', fonepayTraceId: payload.fonepayTraceId };
        }
        if (payload.paymentSuccess === false) {
          return { type: 'payment_failed' };
        }
      } catch {
        // not JSON, ignore
      }
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

export interface UseFonepayWebSocketOptions {
  websocketUrl: string | null;
  enabled: boolean;
  onEvent?: (event: FonepayWsEvent) => void;
}

export interface UseFonepayWebSocketResult {
  isConnected: boolean;
  lastEvent: FonepayWsEvent | null;
  error: string | null;
}

/**
 * Client-side WebSocket listener for Fonepay QR payment events.
 * Connect when websocketUrl is set and enabled; on message parse and emit verified / payment_success / payment_failed.
 */
export function useFonepayWebSocket({
  websocketUrl,
  enabled,
  onEvent,
}: UseFonepayWebSocketOptions): UseFonepayWebSocketResult {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<FonepayWsEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emit = useCallback(
    (event: FonepayWsEvent) => {
      setLastEvent(event);
      onEvent?.(event);
    },
    [onEvent]
  );

  useEffect(() => {
    if (!websocketUrl || !enabled) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    let closed = false;
    const url = websocketUrl;

    const connect = () => {
      if (closed) return;
      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          if (closed) return;
          setIsConnected(true);
          setError(null);
          reconnectCountRef.current = 0;
        };

        ws.onmessage = (e) => {
          if (closed) return;
          const event = parseWsMessage(e.data);
          if (event) emit(event);
        };

        ws.onclose = () => {
          wsRef.current = null;
          if (closed) return;
          setIsConnected(false);
          emit({ type: 'close' });
          if (
            reconnectCountRef.current < MAX_RECONNECT_ATTEMPTS &&
            !closed
          ) {
            reconnectCountRef.current += 1;
            const delay = INITIAL_RECONNECT_DELAY_MS * Math.pow(2, reconnectCountRef.current - 1);
            reconnectTimeoutRef.current = setTimeout(connect, delay);
          }
        };

        ws.onerror = () => {
          setError('WebSocket error');
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect');
      }
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
    };
  }, [websocketUrl, enabled, emit]);

  return { isConnected, lastEvent, error };
}
