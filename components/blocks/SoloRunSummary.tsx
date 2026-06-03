'use client';

import { useSyncExternalStore } from 'react';
import { loadSoloRunResult, type SoloRunResult } from '@/lib/blocks/solo-run-result';

// Zeigt die Solo-Punkte aus dem letzten Durchlauf (Quiz-Endseite, R1.1+R1.3).
//
// Wir lesen den Stand aus sessionStorage (siehe lib/blocks/solo-run-result.ts).
// Direkt-Aufruf von /done ohne vorherigen Lauf → kein Eintrag → unsichtbar.
//
// Bewusst client-side: der Server kennt die Solo-Punkte nicht — sie sind
// Übungs-Motivation, keine DB-Daten (Spec §3.5).
//
// useSyncExternalStore vermeidet Hydration-Mismatch + setState-in-Effect-
// Lint-Warnung. Server-Snapshot ist null (kein sessionStorage in SSR);
// Client-Snapshot ist das tatsächliche Ergebnis.

// Snapshot-Cache pro Modul-ID. useSyncExternalStore erwartet, dass
// getSnapshot() bei wiederholten Aufrufen DIESELBE Referenz liefert
// (sonst infinite-loop, weil React per Identity vergleicht). Da
// sessionStorage sich während der Endseiten-Lifetime nicht ändert,
// reicht ein einmaliges Lesen pro moduleId.
const snapshotCache = new Map<string, SoloRunResult | null>();

function getCachedSnapshot(moduleId: string): SoloRunResult | null {
  if (snapshotCache.has(moduleId)) {
    return snapshotCache.get(moduleId) ?? null;
  }
  const fresh = loadSoloRunResult(moduleId);
  snapshotCache.set(moduleId, fresh);
  return fresh;
}

function noopSubscribe(): () => void {
  // sessionStorage feuert kein Browser-Event innerhalb desselben Tabs —
  // ein no-op-Subscribe reicht, weil wir den Wert nur einmal beim Mount
  // lesen wollen.
  return () => {};
}

export function SoloRunSummary({ moduleId }: { moduleId: string }) {
  const result = useSyncExternalStore<SoloRunResult | null>(
    noopSubscribe,
    () => getCachedSnapshot(moduleId),
    () => null
  );

  if (!result || result.totalPoints === 0) return null;

  const { totalPoints, longestStreak } = result;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-amber-900">🎯 Deine Punkte</span>
        <span className="text-2xl font-semibold text-amber-900 tabular-nums">
          {totalPoints.toLocaleString('de-AT')}
        </span>
      </div>
      {longestStreak >= 2 && (
        <p className="mt-1 text-right text-xs text-amber-800">
          🔥 Längste Serie: <span className="font-medium">{longestStreak}</span>
        </p>
      )}
    </div>
  );
}
