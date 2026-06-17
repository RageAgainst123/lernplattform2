'use client';

import type { Kompetenzbereich } from '@/lib/schemas/entities';
import { KOMPETENZBEREICHE, KOMPETENZBEREICH_INFO, SEKUNDARSTUFE } from '@/lib/curriculum';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Themen-Metadaten-Form (Phase G). Pendant zu ModuleMetadataForm — gleiche
// Konventionen (Title, Beschreibung, Stufe, Bereich, Veröffentlichungs-Flag),
// plus der Themen-spezifische Slug (URL-Segment) und die Reihenfolgs-Nummer.

export type TopicFormValue = {
  slug: string;
  label: string;
  description: string;
  schulstufe: number | null;
  kompetenzbereich: Kompetenzbereich | null;
  isPublished: boolean;
  sortOrder: number;
};

type Props = {
  value: TopicFormValue;
  onChange: (next: TopicFormValue) => void;
};

function NumberOrNull(s: string): number | null {
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// Slug aus dem Label ableiten — Kleinbuchstaben, Umlaute ersetzt, Bindestrich.
// Wird beim Tippen des Labels in /neu auto-gesetzt solange der User nicht
// händisch im Slug-Feld war (siehe useState im Wrapper).
export function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export function TopicForm({ value, onChange }: Props) {
  const set = <K extends keyof TopicFormValue>(k: K, v: TopicFormValue[K]) =>
    onChange({ ...value, [k]: v });
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="t-label">Titel</Label>
        <Input
          id="t-label"
          value={value.label}
          onChange={(e) => set('label', e.target.value)}
          placeholder="z.B. „Das EVA-Prinzip"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="t-slug">URL-Slug</Label>
        <Input
          id="t-slug"
          value={value.slug}
          onChange={(e) => set('slug', e.target.value)}
          placeholder="eva-prinzip"
          pattern="[a-z0-9-]+"
          required
        />
        <p className="text-muted-foreground text-xs">
          Erscheint in der URL. Nur Kleinbuchstaben, Zahlen und Bindestriche.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="t-desc">Beschreibung</Label>
        <Input
          id="t-desc"
          value={value.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Ein bis zwei Sätze für die Themen-Karte"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="t-stufe">Schulstufe</Label>
          <select
            id="t-stufe"
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
          <Label htmlFor="t-bereich">Kompetenzbereich</Label>
          <select
            id="t-bereich"
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
      <div className="space-y-1.5">
        <Label htmlFor="t-sort">Reihenfolge</Label>
        <Input
          id="t-sort"
          type="number"
          min={0}
          value={value.sortOrder}
          onChange={(e) => set('sortOrder', NumberOrNull(e.target.value) ?? 0)}
          className="w-24"
        />
        <p className="text-muted-foreground text-xs">
          Niedrige Werte zuerst (innerhalb von Stufe + Bereich).
        </p>
      </div>
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
            Sichtbar im öffentlichen Bereich. Lehrer:innen können das Thema einer Klasse zuweisen.
          </span>
        </span>
      </label>
    </div>
  );
}
