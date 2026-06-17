// SessionStorage-Bridge zwischen ModuleRunner und Quiz-Endseite (R1.3).
//
// Solo-Punkte werden bewusst NICHT in der DB persistiert (siehe Spec §3.5).
// Sie leben für die Dauer des Browser-Tabs in sessionStorage und füllen die
// Endseite mit „du hast X Punkte erreicht". Beim Tab-Schließen weg —
// gewollt, weil Solo Übung ist, kein Wettbewerb.
//
// Pro Modul ein eigener Key, damit parallele Tabs sich nicht überschreiben
// und damit die Endseite weiß, ob für „dieses Modul" überhaupt gerade
// gespielt wurde (Direkt-URL-Aufruf von /done ohne Spiel → null).

import type { BlockPoints } from '@/components/blocks/useRunnerPoints';

export type SoloRunResult = {
  totalPoints: number;
  longestStreak: number;
  pointsByBlock: Record<string, BlockPoints>;
};

const KEY_PREFIX = 'solo-run-result:';

function key(moduleId: string): string {
  return `${KEY_PREFIX}${moduleId}`;
}

export function stashSoloRunResult(moduleId: string, result: SoloRunResult): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(key(moduleId), JSON.stringify(result));
  } catch {
    // QuotaExceeded etc. → still keep going, Endseite zeigt halt nur Score.
  }
}

export function loadSoloRunResult(moduleId: string): SoloRunResult | null {
  if (typeof sessionStorage === 'undefined') return null;
  const raw = sessionStorage.getItem(key(moduleId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isSoloRunResult(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSoloRunResult(moduleId: string): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(key(moduleId));
}

// Type-Guard: stellt sicher, dass eine korrupte/manipulierte
// sessionStorage-Row die Endseite nicht in einen Render-Fehler reißt.
function isSoloRunResult(v: unknown): v is SoloRunResult {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.totalPoints === 'number' &&
    typeof r.longestStreak === 'number' &&
    typeof r.pointsByBlock === 'object' &&
    r.pointsByBlock !== null
  );
}
