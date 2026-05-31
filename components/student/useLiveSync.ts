'use client';

import { useEffect, useState } from 'react';
import type { LiveState } from '@/app/api/live/route';

// Pollt /api/live im festen Intervall und liefert den aktuellen Live-Zustand.
// Pausiert, wenn der Tab versteckt ist (document.hidden) — spart Last und Akku;
// beim Zurückkehren wird sofort einmal frisch geholt. Netzfehler sind tolerant
// (try/catch → nächster Tick). Alles wird im useEffect-Cleanup abgeräumt.

const POLL_INTERVAL_MS = 2500;

export function useLiveSync(): LiveState {
  const [state, setState] = useState<LiveState>({ active: false });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function poll() {
      if (document.hidden) return;
      try {
        const res = await fetch('/api/live', { cache: 'no-store' });
        if (!res.ok) return;
        const next = (await res.json()) as LiveState;
        if (!cancelled) setState(next);
      } catch {
        // Netz-/Abbruchfehler ignorieren — der nächste Tick versucht es erneut.
      }
    }

    function onVisibility() {
      if (!document.hidden) void poll();
    }

    void poll();
    timer = setInterval(poll, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return state;
}
