import { useState, useEffect, useRef } from 'react';

const DEFAULT_MS = 400;

/**
 * Debounces a value. Returns the debounced value after the input has been
 * unchanged for `delayMs` milliseconds.
 */
export function useDebounce<T>(value: T, delayMs: number = DEFAULT_MS): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
      timeoutRef.current = null;
    }, delayMs);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
