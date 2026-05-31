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

  // Start beim Mount + sauberes Beenden beim Unmount UND beim Tab-Schließen.
  useEffect(() => {
    if (!classId || !moduleId) return;
    void startPresentation(classId, moduleId);
    started.current = true;

    // beforeunload: letzter Versuch beim Tab-Schließen/Neu-Laden.
    // fetch mit keepalive überlebt das Unload-Event (sendBeacon-Ersatz für Server-Actions).
    // classId im Body ist der Scope — der Server prüft, ob eine aktive Session
    // für genau diese Klasse existiert.
    function onUnload() {
      if (started.current) {
        void fetch('/api/live/end', {
          method: 'POST',
          keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ classId }),
        });
      }
    }
    window.addEventListener('beforeunload', onUnload);

    return () => {
      window.removeEventListener('beforeunload', onUnload);
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
