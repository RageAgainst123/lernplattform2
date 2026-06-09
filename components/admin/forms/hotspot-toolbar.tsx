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

// Schalter, ob die Zonen für Schüler:innen sichtbar sind. „verstecken" =
// Frei-Klick-Modus (Schüler:in sucht & klickt frei aufs Bild). Im Editor bleiben
// die Zonen immer sichtbar — der Schalter betrifft nur die Schüler-Sicht.
export function RevealToggle({
  reveal,
  onChange,
}: {
  reveal: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-muted-foreground">Zonen für Schüler:innen:</span>
      <div className="inline-flex overflow-hidden rounded-md border">
        <button
          type="button"
          onClick={() => onChange(true)}
          aria-pressed={reveal}
          className={reveal ? 'bg-primary px-3 py-1 text-white' : 'hover:bg-muted px-3 py-1'}
        >
          👁 anzeigen
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          aria-pressed={!reveal}
          className={!reveal ? 'bg-primary px-3 py-1 text-white' : 'hover:bg-muted px-3 py-1'}
        >
          🙈 verstecken
        </button>
      </div>
    </div>
  );
}

// Optionales Klick-Limit für den versteckten Modus. Nur sichtbar, wenn die
// Zonen versteckt sind. correctCount = Vorschlagswert (= Anzahl richtiger Zonen).
export function MaxClicksField({
  value,
  correctCount,
  onChange,
}: {
  value: number | undefined;
  correctCount: number;
  onChange: (n: number | undefined) => void;
}) {
  return (
    <label className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-muted-foreground">Max. Klicks (versteckt, optional):</span>
      <input
        type="number"
        min={1}
        max={20}
        value={value ?? ''}
        placeholder="unbegrenzt"
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        className="border-input bg-background h-8 w-28 rounded-md border px-2"
      />
      <span className="text-muted-foreground">Tipp: = Anzahl richtiger Zonen ({correctCount})</span>
    </label>
  );
}

// Schalter, ob das Bild gezoomt/verschoben werden kann (für detailreiche
// Bilder). Default aus. Gilt für Schüler-Sicht UND Editor-Vorschau.
export function ZoomToggle({
  zoomable,
  onChange,
}: {
  zoomable: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs">
      <input type="checkbox" checked={zoomable} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-muted-foreground">🔍 Bild zoom-/verschiebbar (große Bilder)</span>
    </label>
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
