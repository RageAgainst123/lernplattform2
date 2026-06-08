'use client';

// Toolbar-Umschalter über dem Hotspot-Bild: „richtig/Ablenker" für die nächste
// Zone + Form (Kreis = Klick, Rechteck = Aufziehen). Ausgelagert aus
// HotspotForm wegen der Zeilen-Grenze.

export type HotspotShape = 'circle' | 'rect';

// Auswahl, in welche Gruppe neue Zonen kommen (nur im Gruppen-Modus über dem
// Bild sichtbar). Rendert nichts, wenn keine Gruppen existieren.
export function ActiveGroupSelect({
  groups,
  value,
  onChange,
}: {
  groups: { id: string; label: string }[];
  value: string | undefined;
  onChange: (id: string | undefined) => void;
}) {
  if (groups.length === 0) return null;
  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground">Neue Zone in Gruppe:</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="border-input bg-background h-8 rounded-md border px-2 text-sm font-medium"
      >
        {groups.map((g, i) => (
          <option key={g.id} value={g.id}>
            {i + 1}. {g.label}
          </option>
        ))}
      </select>
    </label>
  );
}

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
