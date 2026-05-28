'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Hash-Permalink-Schema für die zweistufige Stufen-Seite:
//   #orientierung               → Bereich „orientierung" offen
//   #orientierung/eva-prinzip   → Bereich + Thema offen
// Maximal ein Schrägstrich. Leerer Hash = nichts offen.

export type ParsedHash = { bereich: string | null; topic: string | null };

// Pure Helper, getrennt testbar.
export function parseNestedHash(hash: string): ParsedHash {
  const raw = hash.replace(/^#/, '');
  if (!raw) return { bereich: null, topic: null };
  const [bereich, topic] = raw.split('/', 2);
  return { bereich: bereich || null, topic: topic || null };
}

export function buildNestedHash(bereich: string | null, topic?: string | null): string {
  if (!bereich) return '';
  return topic ? `${bereich}/${topic}` : bereich;
}

function writeHash(value: string): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.hash = value;
  window.history.replaceState(null, '', url.toString());
}

function scrollToId(id: string): void {
  if (typeof window === 'undefined') return;
  requestAnimationFrame(() => {
    const el = document.getElementById(id);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

export type NestedHashController = {
  bereichValue: string[];
  topicValueByBereich: Record<string, string[]>;
  onBereichChange: (next: string[]) => void;
  onTopicChange: (bereich: string, next: string[]) => void;
};

function applyHash(
  parsed: ParsedHash,
  bereichSlugs: readonly string[],
  topicsByBereich: Readonly<Record<string, readonly string[]>>,
  setBereich: (next: string[] | ((prev: string[]) => string[])) => void,
  setTopics: (
    next: Record<string, string[]> | ((prev: Record<string, string[]>) => Record<string, string[]>)
  ) => void
): void {
  if (!parsed.bereich || !bereichSlugs.includes(parsed.bereich)) return;
  const bereich = parsed.bereich;
  setBereich((prev) => (prev.includes(bereich) ? prev : [...prev, bereich]));
  if (parsed.topic && topicsByBereich[bereich]?.includes(parsed.topic)) {
    const topic = parsed.topic;
    setTopics((prev) => {
      const cur = prev[bereich] ?? [];
      return cur.includes(topic) ? prev : { ...prev, [bereich]: [...cur, topic] };
    });
    scrollToId(topic);
  } else {
    scrollToId(bereich);
  }
}

// Synchronisiert Hash-Lesen (Mount + hashchange-Event) mit den State-Settern.
// Refs werden separat via useEffect aktualisiert, damit Effect-Identitäten
// stabil bleiben.
function useHashSync(
  bereichSlugs: readonly string[],
  topicsByBereich: Readonly<Record<string, readonly string[]>>,
  setBereich: (next: string[] | ((prev: string[]) => string[])) => void,
  setTopics: (
    next: Record<string, string[]> | ((prev: Record<string, string[]>) => Record<string, string[]>)
  ) => void
): void {
  const bereichRef = useRef(bereichSlugs);
  const topicsRef = useRef(topicsByBereich);
  useEffect(() => {
    bereichRef.current = bereichSlugs;
    topicsRef.current = topicsByBereich;
  }, [bereichSlugs, topicsByBereich]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    applyHash(
      parseNestedHash(window.location.hash),
      bereichRef.current,
      topicsRef.current,
      setBereich,
      setTopics
    );
    const onHashChange = (): void => {
      applyHash(
        parseNestedHash(window.location.hash),
        bereichRef.current,
        topicsRef.current,
        setBereich,
        setTopics
      );
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [setBereich, setTopics]);
}

export function useNestedHashAccordion(
  bereichSlugs: readonly string[],
  topicsByBereich: Readonly<Record<string, readonly string[]>>
): NestedHashController {
  const [bereichValue, setBereichValue] = useState<string[]>([]);
  const [topicValueByBereich, setTopicValueByBereich] = useState<Record<string, string[]>>({});

  useHashSync(bereichSlugs, topicsByBereich, setBereichValue, setTopicValueByBereich);

  const onBereichChange = useCallback((next: string[]) => {
    setBereichValue(next);
    const last = next.length > 0 ? next[next.length - 1] : null;
    writeHash(buildNestedHash(last));
  }, []);

  const onTopicChange = useCallback((bereich: string, next: string[]) => {
    setTopicValueByBereich((prev) => ({ ...prev, [bereich]: next }));
    const last = next.length > 0 ? next[next.length - 1] : null;
    writeHash(buildNestedHash(bereich, last));
  }, []);

  return { bereichValue, topicValueByBereich, onBereichChange, onTopicChange };
}
