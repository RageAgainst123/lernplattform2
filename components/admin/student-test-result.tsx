'use client';

import { percentScore } from '@/lib/blocks/evaluate';
import { Button } from '@/components/ui/button';

// Simulierte Ergebnis-Karte nach „Abgeben"/„Fertig" im Schüler-Test.
// Zeigt Score + Prozent (oder neutral, wenn das Modul keine bewertbaren
// Blöcke hat) + Neu-starten. Bildet die echte Bewertung 1:1 ab, ohne
// irgendetwas zu speichern.

export function TestResultCard({
  score,
  max,
  onReset,
}: {
  score: number;
  max: number;
  onReset: () => void;
}) {
  const pct = percentScore(score, max);
  // Score auf 1 Nachkommastelle (Teilpunkte), aber ganze Zahlen ohne „.0".
  const scoreLabel = Number.isInteger(score) ? String(score) : score.toFixed(1);
  return (
    <div
      data-testid="test-result"
      className="mx-auto max-w-md space-y-4 rounded-xl border p-6 text-center"
    >
      <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
        Test-Abgabe (nicht gespeichert)
      </p>
      {max > 0 ? (
        <>
          <p className="text-4xl font-bold" data-testid="test-result-percent">
            {pct}%
          </p>
          <p className="text-muted-foreground">
            {scoreLabel} von {max} Punkten
          </p>
        </>
      ) : (
        <p className="text-muted-foreground">
          Dieses Modul hat keine bewertbaren Aufgaben — es gibt keine Prozent-Note.
        </p>
      )}
      <Button data-testid="test-reset" variant="outline" onClick={onReset}>
        ↺ Test neu starten
      </Button>
    </div>
  );
}
