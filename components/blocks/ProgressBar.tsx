// Visueller Fortschrittsbalken für den Quiz-Modus. ARIA-Attribute machen den
// Fortschritt für Screenreader hörbar (Standard `progressbar`-Pattern).
export function ProgressBar({ current, total }: { current: number; total: number }) {
  const safeTotal = Math.max(total, 1);
  const position = Math.min(current + 1, safeTotal);
  const percent = (position / safeTotal) * 100;
  return (
    <div
      className="bg-muted h-2 overflow-hidden rounded-full"
      role="progressbar"
      aria-valuenow={position}
      aria-valuemin={0}
      aria-valuemax={safeTotal}
      aria-label={`Aufgabe ${position} von ${safeTotal}`}
    >
      <div className="bg-primary h-full transition-all" style={{ width: `${percent}%` }} />
    </div>
  );
}
