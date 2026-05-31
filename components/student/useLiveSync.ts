'use client';

import { useEffect, useRef, useState } from 'react';
import type { LiveState } from '@/app/api/live/route';

// Pollt /api/live und liefert den aktuellen Live-Zustand. ADAPTIV: läuft eine
// Präsentation, wird schnell gepollt (1 s → geringe Verzögerung beim
// Folienwechsel); läuft keine, langsam (5 s → spart Last im Normalbetrieb,
// wenn Kinder an Modulen arbeiten). Pausiert bei verstecktem Tab
// (document.hidden) und holt beim Zurückkehren sofort frisch. Netzfehler sind
// tolerant (try/catch → nächster Tick). Self-scheduling per setTimeout, damit
// das Intervall ohne Neu-Mount zwischen aktiv/inaktiv umschalten kann.

const ACTIVE_MS = 1000;
const IDLE_MS = 5000;

export function useLiveSync(): LiveState {
  const [state, setState] = useState<LiveState>({ active: false });
  // Letzter bekannter Aktiv-Zustand, damit der Scheduler das richtige Intervall
  // wählt, ohne als Effect-Dependency einen Neustart auszulösen.
  const activeRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      if (!document.hidden) {
        try {
          const res = await fetch('/api/live', { cache: 'no-store' });
          if (res.ok) {
            const next = (await res.json()) as LiveState;
            if (!cancelled) {
              activeRef.current = next.active;
              setState(next);
            }
          }
        } catch {
          // Netz-/Abbruchfehler ignorieren — der nächste Tick versucht es erneut.
        }
      }
      if (!cancelled) {
        timer = setTimeout(poll, activeRef.current ? ACTIVE_MS : IDLE_MS);
      }
    }

    function onVisibility() {
      // Beim Zurückkehren sofort frisch holen — aber erst den anstehenden Timer
      // abräumen, sonst liefen zwei poll-Ketten parallel (doppelte Frequenz).
      if (!document.hidden) {
        if (timer) clearTimeout(timer);
        void poll();
      }
    }

    void poll();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return state;
}
