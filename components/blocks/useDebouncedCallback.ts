'use client';

import { useCallback, useEffect, useRef } from 'react';

// Debouncer für Auto-Save. Wartet `delay` ms nach dem letzten Aufruf, ruft dann
// `fn` mit den ZULETZT gelieferten Argumenten. Stellt sicher, dass keine zwei
// Aufrufe parallel laufen (pendingRef-Mutex). Beim Unmount wird der Timer
// gestoppt — kein Memory-Leak.

export function useDebouncedCallback<T>(
  fn: (value: T) => Promise<void>,
  delay: number
): (value: T) => void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef(false);
  const fnRef = useRef(fn);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return useCallback(
    (value: T) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        if (pendingRef.current) return; // schon eine laufende Save-Operation
        pendingRef.current = true;
        try {
          await fnRef.current(value);
        } finally {
          pendingRef.current = false;
        }
      }, delay);
    },
    [delay]
  );
}
