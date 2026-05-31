'use client';

import { useEffect, useState } from 'react';
import type { ResultsResponse } from '@/app/api/live/results/route';

// Beamer-Polling-Hook: fragt /api/live/results regelmäßig nach Stimmen-Aggregat,
// Reveal-/Lock-Flags und Teilnehmer-/Voter-Zahl. Pausiert bei verstecktem Tab
// (document.hidden), holt beim Zurückkehren sofort frisch. Eine Datei statt
// pro Beamer eine eigene Poll-Implementierung (DRY + ein zentraler Ort für
// Polling-Frequenz-Tuning).

const POLL_MS = 2000;

const EMPTY: ResultsResponse = {
  counts: {},
  revealed: false,
  locked: false,
  present: 0,
  voters: 0,
};

export function useLiveResults(classId: string, blockId: string): ResultsResponse {
  const [state, setState] = useState<ResultsResponse>(EMPTY);
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    async function poll() {
      if (!document.hidden) {
        try {
          const res = await fetch(
            `/api/live/results?classId=${encodeURIComponent(classId)}&blockId=${encodeURIComponent(blockId)}`,
            { cache: 'no-store' }
          );
          if (res.ok) {
            const next = (await res.json()) as ResultsResponse;
            if (!cancelled) setState(next);
          }
        } catch {
          // Netz-/Abbruchfehler ignorieren — der nächste Tick versucht es erneut.
        }
      }
      if (!cancelled) timer = setTimeout(poll, POLL_MS);
    }
    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [classId, blockId]);
  return state;
}
