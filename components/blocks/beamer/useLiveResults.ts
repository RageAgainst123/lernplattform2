'use client';

import { useEffect, useState } from 'react';
import type { ResultsResponse } from '@/app/api/live/results/route';

// Beamer-Polling-Hook: fragt /api/live/results regelmäßig nach Stimmen-Aggregat,
// Reveal-/Lock-Flags und Teilnehmer-/Voter-Zahl. Pausiert bei verstecktem Tab
// (document.hidden), holt beim Zurückkehren sofort frisch. Eine Datei statt
// pro Beamer eine eigene Poll-Implementierung (DRY + ein zentraler Ort für
// Polling-Frequenz-Tuning).
//
// 2026-06-05: revealed-Flag ist sticky pro (classId, blockId). Ein einmal
// aufgelöster Block darf während derselben Folie nicht mehr zurück auf
// `revealed: false` flippen — sonst sieht die Lehrer:in den Flash
// „grün → blau", weil ein einzelner Poll-Race oder eine kurze inaktive
// Session-Phase die richtige-Antwort-Hervorhebung verschwinden lässt.
// Beim Wechsel der Folie (blockId-Wechsel) wird der Hook neu gemountet und
// startet wieder mit revealed=false — sticky greift dort nicht.
// Gleicher Fix gilt sinngemäß für locked: einmal gesperrt, bleibt gesperrt
// bis zur nächsten Folie (Lehrer:in kann „Abstimmung öffnen" — das setzt
// locked=false in der DB, aber selbst dann sehen wir den DB-Wert beim
// nächsten Poll, also kein false-positive durch sticky).

const POLL_MS = 2000;

const EMPTY: ResultsResponse = {
  counts: {},
  revealed: false,
  locked: false,
  present: 0,
  voters: 0,
};

// Merge mit sticky-Bias auf revealed: wenn der vorherige State revealed=true
// hatte, bleibt der neue State revealed=true unabhängig vom Server-Response.
// locked folgt NICHT diesem Pattern, weil Lehrer:in „Abstimmung öffnen"
// klicken kann und das Auflocking spiegeln muss.
function stickyRevealed(prev: ResultsResponse, next: ResultsResponse): ResultsResponse {
  if (prev.revealed && !next.revealed) {
    return { ...next, revealed: true };
  }
  return next;
}

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
            if (!cancelled) setState((prev) => stickyRevealed(prev, next));
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
