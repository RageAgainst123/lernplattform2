'use client';

// Toolbar-Umschalter über dem Hotspot-Bild: „richtig/Ablenker" für die nächste
// Zone + Form (Kreis = Klick, Rechteck = Aufziehen). Ausgelagert aus
// HotspotForm wegen der Zeilen-Grenze.

export type HotspotShape = 'circle' | 'rect';

export function NewZoneToggle({
  isCorrect,
  onChange,
}: {
  isCorrect: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-muted-foreground">Neue Zone ist:</span>
      <div className="inline-flex overflow-hidden rounded-md border">
        <button
          type="button"
          onClick={() => onChange(true)}
          aria-pressed={isCorrect}
          className={
            isCorrect ? 'bg-green-600 px-3 py-1 font-medium text-white' : 'hover:bg-muted px-3 py-1'
          }
        >
          ✓ richtig
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          aria-pressed={!isCorrect}
          className={
            !isCorrect ? 'bg-gray-500 px-3 py-1 font-medium text-white' : 'hover:bg-muted px-3 py-1'
          }
        >
          Ablenker
        </button>
      </div>
    </div>
  );
}

export function ShapeToggle({
  shape,
  onChange,
}: {
  shape: HotspotShape;
  onChange: (next: HotspotShape) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-muted-foreground">Form:</span>
      <div className="inline-flex overflow-hidden rounded-md border">
        <button
          type="button"
          onClick={() => onChange('circle')}
          aria-pressed={shape === 'circle'}
          className={
            shape === 'circle' ? 'bg-primary px-3 py-1 text-white' : 'hover:bg-muted px-3 py-1'
          }
        >
          ◯ Kreis
        </button>
        <button
          type="button"
          onClick={() => onChange('rect')}
          aria-pressed={shape === 'rect'}
          className={
            shape === 'rect' ? 'bg-primary px-3 py-1 text-white' : 'hover:bg-muted px-3 py-1'
          }
        >
          ▭ Rechteck
        </button>
      </div>
    </div>
  );
}
