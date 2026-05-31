'use client';

import { useEffect, useRef } from 'react';
import { startPresentation, setLiveBlock, endPresentation } from '@/lib/db/live-session-actions';

// Verdrahtet den Beamer-PresentationRunner mit der Live-Session: startet die
// Präsentation beim Mount, meldet jeden Folienwechsel an die DB (Schüler:innen-
// Geräte pollen den Wert) und beendet sie beim Verlassen der Seite. No-op, wenn
// keine classId/moduleId übergeben wird (reine Vorschau ohne Live).
export function usePresentationLive(
  classId: string | undefined,
  moduleId: string | undefined,
  index: number
) {
  const started = useRef(false);

  // Start beim Mount + sauberes Beenden beim Unmount.
  useEffect(() => {
    if (!classId || !moduleId) return;
    void startPresentation(classId, moduleId);
    started.current = true;
    // Beim Tab-Schließen best-effort beenden (sendBeacon-Ersatz: fire & forget).
    return () => {
      if (started.current) void endPresentation(classId);
    };
    // Nur beim Mount/Unmount — index-Updates laufen über den zweiten Effect.
  }, [classId, moduleId]);

  // Jeden Folienwechsel an die aktive Session melden.
  useEffect(() => {
    if (!classId || !started.current) return;
    void setLiveBlock(classId, index);
  }, [classId, index]);
}
