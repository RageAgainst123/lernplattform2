'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Kompetenzbereich, MaterialType } from '@/lib/schemas/entities';
import { KOMPETENZBEREICHE, KOMPETENZBEREICH_INFO, SEKUNDARSTUFE } from '@/lib/curriculum';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { createMaterial } from '@/lib/db/material-actions';

const TYPES: { value: MaterialType; label: string }[] = [
  { value: 'arbeitsblatt', label: 'Arbeitsblatt' },
  { value: 'theorie', label: 'Theorie' },
  { value: 'loesung', label: 'Lösung' },
  { value: 'stundenbild', label: 'Stundenbild' },
];

export function MaterialUploadForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const file = fd.get('file') as File;
    const input = {
      title: String(fd.get('title') ?? ''),
      description: String(fd.get('description') ?? '') || undefined,
      schulstufe: fd.get('schulstufe') ? Number(fd.get('schulstufe')) : undefined,
      kompetenzbereich: (fd.get('kompetenzbereich') as Kompetenzbereich) || undefined,
      topic: String(fd.get('topic') ?? '') || undefined,
      materialType: fd.get('materialType') as MaterialType,
      isTeacherOnly: fd.get('isTeacherOnly') === 'on',
    };
    startTransition(async () => {
      try {
        const { id } = await createMaterial(input, file);
        router.push(`/admin/material/${id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload fehlgeschlagen.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="title">Titel</Label>
        <Input id="title" name="title" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">Beschreibung</Label>
        <Input id="description" name="description" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="schulstufe">Schulstufe</Label>
          <select
            id="schulstufe"
            name="schulstufe"
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
        <Input id="topic" name="topic" placeholder="z.B. EVA-Prinzip" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="materialType">Material-Typ</Label>
        <select
          id="materialType"
          name="materialType"
          required
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
        <input type="checkbox" name="isTeacherOnly" className="size-4" />
        Nur für Lehrer:innen (z.B. Lösungen)
      </label>
      <div className="space-y-1">
        <Label htmlFor="file">PDF-Datei</Label>
        <Input id="file" name="file" type="file" accept="application/pdf" required />
      </div>

      {error && (
        <p role="alert" className="text-destructive bg-destructive/10 rounded-md p-3 text-sm">
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Lade hoch…' : 'Hochladen'}
      </Button>
    </form>
  );
}
