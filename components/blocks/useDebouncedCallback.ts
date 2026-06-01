'use client';

import { useCallback, useEffect, useRef } from 'react';

// Debouncer für Auto-Save. Wartet `delay` ms nach dem letzten Aufruf, ruft dann
// `fn` mit den ZULETZT gelieferten Argumenten. Stellt sicher, dass keine zwei
// Aufrufe parallel laufen (pendingRef-Mutex). Beim Unmount wird der Timer
// gestoppt — pending-Wert wird vorher noch geflusht (Phase H+ Sub-A: sonst
// gehen letzte Edits verloren, wenn der User die Seite verlässt bevor der
// Timer abläuft).
//
// Liefert ein Tupel [trigger, flushNow]:
//   trigger(value) — debounced.
//   flushNow()     — sofort feuern (mit dem zuletzt getriggerten Wert).

type PendingState<T> = { has: boolean; value: T };

export function useDebouncedCallback<T>(
  fn: (value: T) => Promise<void>,
  delay: number
): [(value: T) => void, () => Promise<void>] {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef(false);
  const lastValueRef = useRef<PendingState<T>>({ has: false, value: undefined as T });
  const fnRef = useRef(fn);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useUnmountFlush(timerRef, lastValueRef, fnRef);

  const trigger = useCallback(
    (value: T) => {
      lastValueRef.current = { has: true, value };
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        if (pendingRef.current) return;
        await runSave(pendingRef, lastValueRef, fnRef);
      }, delay);
    },
    [delay]
  );

  const flushNow = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!lastValueRef.current.has) return;
    await runSave(pendingRef, lastValueRef, fnRef);
  }, []);

  return [trigger, flushNow];
}

// Hilfsfunktion: gespeicherten Wert konsumieren + an fn weiterreichen, mit
// Mutex-Schutz gegen parallele Aufrufe.
async function runSave<T>(
  pendingRef: React.RefObject<boolean>,
  lastValueRef: React.RefObject<PendingState<T>>,
  fnRef: React.RefObject<(v: T) => Promise<void>>
): Promise<void> {
  pendingRef.current = true;
  const v = lastValueRef.current.value;
  lastValueRef.current = { has: false, value: undefined as T };
  try {
    await fnRef.current(v);
  } finally {
    pendingRef.current = false;
  }
}

// Beim Unmount noch ausstehende Werte fire-and-forget flushen — wir können
// nicht awaiten, aber die Server-Action ist bereits unterwegs.
function useUnmountFlush<T>(
  timerRef: React.RefObject<ReturnType<typeof setTimeout> | null>,
  lastValueRef: React.RefObject<PendingState<T>>,
  fnRef: React.RefObject<(v: T) => Promise<void>>
) {
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (lastValueRef.current.has) {
        void fnRef.current(lastValueRef.current.value);
        lastValueRef.current = { has: false, value: undefined as T };
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
