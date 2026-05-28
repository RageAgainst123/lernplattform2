'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Synchronisiert geöffnete Accordion-Items mit dem URL-Hash:
// - beim Mount: wenn der aktuelle Hash einem bekannten Slug entspricht, wird
//   genau dieses Item geöffnet und in den Viewport gescrollt
// - beim Aufklappen: das zuletzt geöffnete Item wandert in den Hash
// - beim manuellen URL-Hash-Tippen (`hashchange`): das matching Item wird zugeklappt-toggle-konform geöffnet
// Gibt `value` + `onValueChange` zurück — direkt an <Accordion /> reichbar.

function readHashSlug(): string | null {
  if (typeof window === 'undefined') return null;
  return window.location.hash.replace(/^#/, '') || null;
}

function writeHash(slug: string | null): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.hash = slug ?? '';
  window.history.replaceState(null, '', url.toString());
}

function scrollToSlug(slug: string): void {
  if (typeof window === 'undefined') return;
  // requestAnimationFrame: warten bis das Item gemountet ist, dann scrollen
  requestAnimationFrame(() => {
    const el = document.getElementById(slug);
    // jsdom hat keine scrollIntoView-Implementierung — defensiv prüfen.
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

export function useHashAccordion(knownSlugs: string[]): {
  value: string[];
  onValueChange: (next: string[]) => void;
} {
  const [value, setValue] = useState<string[]>([]);
  const slugsRef = useRef(knownSlugs);
  // Slug-Liste in Ref synchronisieren — Effects sehen stets die aktuellste Version,
  // ohne dass sich die Effect-Identitäten ändern (sonst rebinden wir den Listener).
  useEffect(() => {
    slugsRef.current = knownSlugs;
  }, [knownSlugs]);

  // Beim Mount: Hash auslesen, wenn er einem Slug entspricht → öffnen.
  useEffect(() => {
    const slug = readHashSlug();
    if (slug && slugsRef.current.includes(slug)) {
      setValue([slug]);
      scrollToSlug(slug);
    }
  }, []);

  // Hash-Änderungen (User tippt URL um, drückt Back/Forward): item öffnen.
  useEffect(() => {
    const onHashChange = (): void => {
      const slug = readHashSlug();
      if (slug && slugsRef.current.includes(slug)) {
        setValue((prev) => (prev.includes(slug) ? prev : [...prev, slug]));
        scrollToSlug(slug);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const onValueChange = useCallback((next: string[]) => {
    setValue(next);
    // Letztes geöffnetes Item bestimmt den Hash; leerer Hash wenn nichts offen
    writeHash(next.length > 0 ? next[next.length - 1] : null);
  }, []);

  return { value, onValueChange };
}
