'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Kompetenzbereich } from '@/lib/schemas/entities';
import { createTopic, updateTopic, deleteTopic } from '@/lib/db/topic-actions';
import { Button } from '@/components/ui/button';
import { TopicForm, slugify, type TopicFormValue } from './TopicForm';

// Themen-Editor (Phase G). Pendant zum ModuleEditor — Sticky-Header mit Save-
// Button, Metadaten-Form unten. Bei /neu: Auto-Slug aus Label. Bei /[id]:
// Slug bleibt was er ist (Slug-Wechsel hätte Bookmarks-Bruch zur Folge).

type Props = {
  topicId?: string;
  initialValue: TopicFormValue;
};

export function TopicEditor({ topicId, initialValue }: Props) {
  const router = useRouter();
  const [value, setValueRaw] = useState<TopicFormValue>(initialValue);
  const [slugTouched, setSlugTouched] = useState(Boolean(topicId));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Beim Tippen des Labels in /neu wird der Slug auto-mitgezogen, bis der
  // User selbst im Slug-Feld war. Im Edit-Modus bleibt der Slug stabil.
  function setValue(next: TopicFormValue) {
    if (!slugTouched && next.label !== value.label) {
      setValueRaw({ ...next, slug: slugify(next.label) });
    } else {
      setValueRaw(next);
    }
    if (next.slug !== value.slug) setSlugTouched(true);
  }

  function handleSave() {
    setError(null);
    const payload = {
      slug: value.slug,
      label: value.label,
      description: value.description || undefined,
      schulstufe: (value.schulstufe ?? undefined) as number | undefined,
      kompetenzbereich: (value.kompetenzbereich ?? undefined) as Kompetenzbereich | undefined,
      isPublished: value.isPublished,
      sortOrder: value.sortOrder,
    };
    startTransition(async () => {
      try {
        if (topicId) {
          await updateTopic(topicId, payload);
          router.refresh();
        } else {
          const { id } = await createTopic(payload);
          router.push(`/admin/themen/${id}`);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unbekannter Fehler.');
      }
    });
  }

  function handleDelete() {
    if (!topicId) return;
    if (!window.confirm('Thema wirklich löschen? Zugeordnete Module bleiben erhalten.')) return;
    startTransition(async () => {
      try {
        await deleteTopic(topicId);
        // deleteTopic ruft serverseitig redirect('/admin/themen')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unbekannter Fehler.');
      }
    });
  }

  return (
    <div className="space-y-6">
      <header className="bg-background sticky top-0 z-10 -mx-4 flex items-center justify-between gap-4 border-b px-4 py-3 sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden>
            📚
          </span>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {topicId ? 'Thema bearbeiten' : 'Neues Thema'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {topicId && (
            <Button variant="outline" onClick={handleDelete} disabled={pending}>
              Löschen
            </Button>
          )}
          <Button onClick={handleSave} disabled={pending || !value.label || !value.slug}>
            {pending ? 'Speichere…' : 'Speichern'}
          </Button>
        </div>
      </header>
      {error && (
        <div role="alert" className="text-destructive bg-destructive/10 rounded-md p-3 text-sm">
          {error}
        </div>
      )}
      <TopicForm value={value} onChange={setValue} />
    </div>
  );
}
