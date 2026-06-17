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
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="m-title">Titel</Label>
        <Input
          id="m-title"
          value={value.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="z.B. „Das EVA-Prinzip"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="m-desc">Beschreibung</Label>
        <Input
          id="m-desc"
          value={value.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Ein Satz für die Modul-Karte"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
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
        <div className="space-y-1.5">
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
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="m-topic">Thema</Label>
          <Input
            id="m-topic"
            value={value.topic}
            onChange={(e) => set('topic', e.target.value)}
            placeholder="Freitext"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="m-min">Minuten</Label>
          <Input
            id="m-min"
            type="number"
            min={1}
            value={value.estimatedMinutes ?? ''}
            onChange={(e) => set('estimatedMinutes', NumberOrNull(e.target.value))}
            className="w-24"
          />
        </div>
      </div>
      {/* Anzeige-Modus ist NUR für Lernmodule eine sinnvolle Auswahl —
          Präsentationen werden immer am Beamer gezeigt. Zwei Radio-Buttons
          statt langem Select — Optionen-Beschreibungen passen so rein, kein
          abgeschnittener Text mehr. */}
      {value.activityKind === 'lernmodul' && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Anzeige-Modus</legend>
          <DisplayModeOption
            value="quiz"
            current={value.displayMode}
            onChange={(v) => set('displayMode', v)}
            label="Quiz"
            hint="Block-für-Block mit Sofort-Feedback"
          />
          <DisplayModeOption
            value="worksheet"
            current={value.displayMode}
            onChange={(v) => set('displayMode', v)}
            label="Arbeitsblatt"
            hint="Alle Aufgaben auf einer Seite, Abgabe am Ende"
          />
        </fieldset>
      )}
      <label className="hover:bg-muted/40 flex cursor-pointer items-start gap-2.5 rounded-md border p-3 text-sm">
        <input
          type="checkbox"
          checked={value.isPublished}
          onChange={(e) => set('isPublished', e.target.checked)}
          className="mt-0.5 size-4 shrink-0"
        />
        <span>
          <span className="font-medium">Veröffentlicht</span>
          <span className="text-muted-foreground block text-xs">
            Sichtbar im öffentlichen Bereich, Lehrer:innen können zuweisen.
          </span>
        </span>
      </label>
    </div>
  );
}

function DisplayModeOption({
  value: v,
  current,
  onChange,
  label,
  hint,
}: {
  value: DisplayMode;
  current: DisplayMode;
  onChange: (v: DisplayMode) => void;
  label: string;
  hint: string;
}) {
  const active = current === v;
  return (
    <label
      className={
        active
          ? 'border-primary bg-primary/5 flex cursor-pointer items-start gap-2.5 rounded-md border p-3 text-sm'
          : 'hover:bg-muted/40 flex cursor-pointer items-start gap-2.5 rounded-md border p-3 text-sm'
      }
    >
      <input
        type="radio"
        name="m-mode"
        checked={active}
        onChange={() => onChange(v)}
        className="mt-0.5 size-4 shrink-0"
      />
      <span>
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground block text-xs">{hint}</span>
      </span>
    </label>
  );
}
