'use client';

import { useEffect, useRef } from 'react';

// Ruft onEnd() auf, wenn ms lang keine Aktivität (Folienwechsel/Taste) gemeldet
// wurde. Der zurückgegebene bump() setzt den Timer zurück — der Beamer ruft ihn
// bei jeder Navigation auf. Schützt vor vergessenen Präsentationen (Beamer läuft,
// niemand bedient ihn). Ergänzt den serverseitigen Heartbeat-Tod (60 s): hier geht
// es um den Fall, dass der Beamer-Tab offen BLEIBT, aber ungenutzt ist.
export function useIdleEnd(onEnd: () => void, ms: number): () => void {
  const onEndRef = useRef(onEnd);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Aktuelle Callback-Referenz im Effect halten (kein Ref-Write während Render).
  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    function bump() {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => onEndRef.current(), ms);
    }
    bump();
    const onTimer = timer;
    return () => {
      if (onTimer.current) clearTimeout(onTimer.current);
    };
  }, [ms]);

  // Stabiler bump für den Aufrufer — greift auf denselben Timer-Ref zu.
  return () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onEndRef.current(), ms);
  };
}
