'use client';

import type { ActivityKind, DisplayMode, Kompetenzbereich } from '@/lib/schemas/entities';
import { KOMPETENZBEREICHE, KOMPETENZBEREICH_INFO, SEKUNDARSTUFE } from '@/lib/curriculum';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type ModuleMetadata = {
  title: string;
  description: string;
  schulstufe: number | null;
  kompetenzbereich: Kompetenzbereich | null;
  topic: string;
  estimatedMinutes: number | null;
  isPublished: boolean;
  activityKind: ActivityKind;
  displayMode: DisplayMode;
};

type Props = {
  value: ModuleMetadata;
  onChange: (next: ModuleMetadata) => void;
};

function NumberOrNull(s: string): number | null {
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function ModuleMetadataForm({ value, onChange }: Props) {
  const set = <K extends keyof ModuleMetadata>(k: K, v: ModuleMetadata[K]) =>
    onChange({ ...value, [k]: v });
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="m-title">Titel</Label>
        <Input
          id="m-title"
          value={value.title}
          onChange={(e) => set('title', e.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="m-desc">Beschreibung</Label>
        <Input
          id="m-desc"
          value={value.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="m-stufe">Schulstufe</Label>
          <select
            id="m-stufe"
            value={value.schulstufe ?? ''}
            onChange={(e) => set('schulstufe', NumberOrNull(e.target.value))}
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
          >
            <option value="">—</option>
            {SEKUNDARSTUFE.map((s) => (
              <option key={s} value={s}>
                {s}. Schulstufe
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="m-bereich">Kompetenzbereich</Label>
          <select
            id="m-bereich"
            value={value.kompetenzbereich ?? ''}
            onChange={(e) =>
              set('kompetenzbereich', (e.target.value || null) as Kompetenzbereich | null)
            }
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
          >
            <option value="">—</option>
            {KOMPETENZBEREICHE.map((b) => (
              <option key={b} value={b}>
                {KOMPETENZBEREICH_INFO[b].label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="m-topic">Thema (Freitext)</Label>
        <Input id="m-topic" value={value.topic} onChange={(e) => set('topic', e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="m-min">Geschätzte Minuten</Label>
        <Input
          id="m-min"
          type="number"
          min={1}
          value={value.estimatedMinutes ?? ''}
          onChange={(e) => set('estimatedMinutes', NumberOrNull(e.target.value))}
        />
      </div>
      {/* Anzeige-Modus ist NUR für Lernmodule eine sinnvolle Auswahl —
          Präsentationen werden immer am Beamer mit dem PresentationRunner
          gezeigt, da gibt es keine Quiz-vs-Arbeitsblatt-Wahl. */}
      {value.activityKind === 'lernmodul' && (
        <div className="space-y-1">
          <Label htmlFor="m-mode">Anzeige-Modus</Label>
          <select
            id="m-mode"
            value={value.displayMode}
            onChange={(e) => set('displayMode', e.target.value as DisplayMode)}
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
          >
            <option value="quiz">Quiz — Block-für-Block mit Sofort-Feedback</option>
            <option value="worksheet">Arbeitsblatt — alle Aufgaben, Abgabe an Lehrer:in</option>
          </select>
        </div>
      )}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value.isPublished}
          onChange={(e) => set('isPublished', e.target.checked)}
          className="size-4"
        />
        Veröffentlicht (sichtbar im öffentlichen Bereich, Lehrer:innen können zuweisen)
      </label>
    </div>
  );
}
