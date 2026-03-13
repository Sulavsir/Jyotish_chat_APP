'use client';

import { useEffect, useRef, useState } from 'react';
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

const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_DELAY_MS = 1000;

/**
 * Parse WebSocket message and detect verification or payment result.
 */
function parseWsMessage(data: string): FonepayWsEvent | null {
  console.log('[FonepayWS] Raw message:', data);
  try {
    const msg = JSON.parse(data) as WebSocketVerificationMsg & WebSocketPaymentMsg;
    console.log('[FonepayWS] Parsed message:', msg);
    const status = msg.transactionStatus;

    if (msg.qrVerified === true || (typeof status === 'string' && status.toUpperCase() === 'VERIFIED')) {
      console.log('[FonepayWS] QR Verified event detected');
      return { type: 'verified' };
    }

    if (typeof status === 'string') {
      try {
        const payload = JSON.parse(status) as FonepayTransactionStatusPayload;
        console.log('[FonepayWS] Transaction status payload:', payload);
        if (payload.paymentSuccess === true) {
          console.log('[FonepayWS] Payment SUCCESS detected');
          return { type: 'payment_success', fonepayTraceId: payload.fonepayTraceId };
        }
        if (payload.paymentSuccess === false) {
          console.log('[FonepayWS] Payment FAILED detected');
          return { type: 'payment_failed' };
        }
      } catch {
        console.log('[FonepayWS] transactionStatus is not JSON, checking as string:', status);
        if (status.toUpperCase() === 'SUCCESS') {
          console.log('[FonepayWS] Payment SUCCESS (string status)');
          return { type: 'payment_success' };
        }
        if (status.toUpperCase() === 'FAILED' || status.toUpperCase() === 'FAILURE') {
          console.log('[FonepayWS] Payment FAILED (string status)');
          return { type: 'payment_failed' };
        }
      }
    }
  } catch {
    console.log('[FonepayWS] Failed to parse message as JSON');
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
  
  // Use ref to hold onEvent to avoid reconnections when callback changes
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!websocketUrl || !enabled) {
      console.log('[FonepayWS] Not connecting - websocketUrl:', !!websocketUrl, 'enabled:', enabled);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    // Already connected to this URL
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('[FonepayWS] Already connected, skipping reconnect');
      return;
    }

    let closed = false;
    const url = websocketUrl;
    console.log('[FonepayWS] Initiating connection to:', url);

    const connect = () => {
      if (closed) {
        console.log('[FonepayWS] Connection cancelled (closed flag)');
        return;
      }
      
      // Clean up existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      
      try {
        console.log('[FonepayWS] Creating WebSocket connection...');
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          if (closed) return;
          console.log('[FonepayWS] Connected successfully');
          setIsConnected(true);
          setError(null);
          reconnectCountRef.current = 0;
        };

        ws.onmessage = (e) => {
          if (closed) return;
          const event = parseWsMessage(e.data);
          if (event) {
            console.log('[FonepayWS] Emitting event:', event.type);
            setLastEvent(event);
            onEventRef.current?.(event);
          }
        };

        ws.onclose = (e) => {
          console.log('[FonepayWS] Connection closed, code:', e.code, 'reason:', e.reason);
          wsRef.current = null;
          if (closed) return;
          setIsConnected(false);
          
          // Only emit close event if not reconnecting
          if (reconnectCountRef.current >= MAX_RECONNECT_ATTEMPTS) {
            setLastEvent({ type: 'close' });
            onEventRef.current?.({ type: 'close' });
          }
          
          if (reconnectCountRef.current < MAX_RECONNECT_ATTEMPTS && !closed) {
            reconnectCountRef.current += 1;
            const delay = INITIAL_RECONNECT_DELAY_MS * Math.pow(2, reconnectCountRef.current - 1);
            console.log(`[FonepayWS] Reconnecting in ${delay}ms (attempt ${reconnectCountRef.current})`);
            reconnectTimeoutRef.current = setTimeout(connect, delay);
          } else if (reconnectCountRef.current >= MAX_RECONNECT_ATTEMPTS) {
            console.log('[FonepayWS] Max reconnect attempts reached');
            setError('Connection lost. Click "Check Payment Status" to verify.');
          }
        };

        ws.onerror = (e) => {
          console.error('[FonepayWS] WebSocket error:', e);
          setError('WebSocket error');
        };
      } catch (err) {
        console.error('[FonepayWS] Failed to create WebSocket:', err);
        setError(err instanceof Error ? err.message : 'Failed to connect');
      }
    };

    connect();

    return () => {
      console.log('[FonepayWS] Cleanup - closing connection');
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
  }, [websocketUrl, enabled]); // Removed emit from dependencies to prevent reconnects

  return { isConnected, lastEvent, error };
}
