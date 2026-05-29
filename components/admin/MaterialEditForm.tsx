'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Kompetenzbereich, MaterialType } from '@/lib/schemas/entities';
import { KOMPETENZBEREICHE, KOMPETENZBEREICH_INFO, SEKUNDARSTUFE } from '@/lib/curriculum';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { AdminMaterial } from '@/lib/db/materials';
import type { ModuleOption } from '@/lib/db/modules';
import { updateMaterialMeta, deleteMaterial } from '@/lib/db/material-actions';

const TYPES: { value: MaterialType; label: string }[] = [
  { value: 'arbeitsblatt', label: 'Arbeitsblatt' },
  { value: 'theorie', label: 'Theorie' },
  { value: 'loesung', label: 'Lösung' },
  { value: 'stundenbild', label: 'Stundenbild' },
];

type Props = {
  material: AdminMaterial;
  moduleOptions: ModuleOption[];
};

export function MaterialEditForm({ material, moduleOptions }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const input = {
      title: String(fd.get('title') ?? ''),
      description: String(fd.get('description') ?? '') || undefined,
      schulstufe: fd.get('schulstufe') ? Number(fd.get('schulstufe')) : undefined,
      kompetenzbereich: (fd.get('kompetenzbereich') as Kompetenzbereich) || undefined,
      topic: String(fd.get('topic') ?? '') || undefined,
      materialType: fd.get('materialType') as MaterialType,
      isTeacherOnly: fd.get('isTeacherOnly') === 'on',
      relatedModuleId: (fd.get('relatedModuleId') as string) || null,
    };
    startTransition(async () => {
      try {
        await updateMaterialMeta(material.id, input);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.');
      }
    });
  }

  function handleDelete() {
    if (!confirm('Material wirklich löschen? Die PDF-Datei wird auch entfernt.')) return;
    startTransition(async () => {
      try {
        await deleteMaterial(material.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="title">Titel</Label>
        <Input id="title" name="title" defaultValue={material.title} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">Beschreibung</Label>
        <Input id="description" name="description" defaultValue={material.description ?? ''} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="schulstufe">Schulstufe</Label>
          <select
            id="schulstufe"
            name="schulstufe"
            defaultValue={material.schulstufe ?? ''}
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
          <Label htmlFor="kompetenzbereich">Kompetenzbereich</Label>
          <select
            id="kompetenzbereich"
            name="kompetenzbereich"
            defaultValue={material.kompetenzbereich ?? ''}
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
        <Label htmlFor="topic">Thema</Label>
        <Input id="topic" name="topic" defaultValue={material.topic ?? ''} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="materialType">Material-Typ</Label>
        <select
          id="materialType"
          name="materialType"
          required
          defaultValue={material.materialType}
          className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isTeacherOnly"
          defaultChecked={material.isTeacherOnly}
          className="size-4"
        />
        Nur für Lehrer:innen (z.B. Lösungen)
      </label>
      <div className="space-y-1">
        <Label htmlFor="relatedModuleId">Verknüpftes Modul (optional)</Label>
        <select
          id="relatedModuleId"
          name="relatedModuleId"
          defaultValue={material.relatedModuleId ?? ''}
          className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
        >
          <option value="">— keine Verknüpfung —</option>
          {moduleOptions.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </select>
        <p className="text-muted-foreground text-xs">
          Eingeloggte Schüler:innen sehen dann den &bdquo;Online ausfüllen&ldquo;-Button neben dem
          PDF.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-destructive bg-destructive/10 rounded-md p-3 text-sm">
          {error}
        </p>
      )}

      <div className="flex justify-between">
        <Button type="submit" disabled={pending}>
          {pending ? 'Speichere…' : 'Speichern'}
        </Button>
        <Button type="button" variant="ghost" onClick={handleDelete} disabled={pending}>
          Löschen
        </Button>
      </div>
    </form>
  );
}
