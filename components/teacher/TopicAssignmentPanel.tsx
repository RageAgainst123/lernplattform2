'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { assignTopicToClass } from '@/lib/db/class-topic-actions';
import type { PublishedTopicOption } from '@/lib/db/class-topics';
import { Button } from '@/components/ui/button';

// Themen-Zuweisungs-Panel für Lehrer:innen (Phase G3). Default-Workflow:
// einen Lernpfad als Ganzes zuweisen (statt einzelner Module). Die alte
// ModuleAssignmentPanel bleibt für Edge-Cases erhalten (Sonstiges-Sektion).

type Props = {
  classId: string;
  available: PublishedTopicOption[];
  alreadyAssignedIds: string[];
};

function TopicSelect({
  topicId,
  choices,
  pending,
  onChange,
}: {
  topicId: string;
  choices: PublishedTopicOption[];
  pending: boolean;
  onChange: (v: string) => void;
}) {
  const placeholder =
    choices.length === 0 ? '— alle Themen sind bereits zugewiesen —' : '— Thema wählen —';
  return (
    <div className="flex-1 space-y-1">
      <label htmlFor="assign-topic" className="text-sm font-medium">
        Thema zuweisen
      </label>
      <select
        id="assign-topic"
        value={topicId}
        onChange={(e) => onChange(e.target.value)}
        disabled={pending || choices.length === 0}
        className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
      >
        <option value="">{placeholder}</option>
        {choices.map((t) => (
          <option key={t.id} value={t.id}>
            {t.schulstufe ? `${t.schulstufe}. SSt. · ` : ''}
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function AssignForm({
  topicId,
  choices,
  pending,
  onChange,
  onSubmit,
}: {
  topicId: string;
  choices: PublishedTopicOption[];
  pending: boolean;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <TopicSelect topicId={topicId} choices={choices} pending={pending} onChange={onChange} />
      <Button type="submit" disabled={pending || !topicId}>
        {pending ? 'Weise zu…' : 'Zuweisen'}
      </Button>
    </form>
  );
}

export function TopicAssignmentPanel({ classId, available, alreadyAssignedIds }: Props) {
  const router = useRouter();
  const [topicId, setTopicId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const assignedSet = useMemo(() => new Set(alreadyAssignedIds), [alreadyAssignedIds]);
  const choices = useMemo(
    () => available.filter((t) => !assignedSet.has(t.id)),
    [available, assignedSet]
  );

  function handleAssign() {
    if (!topicId) {
      setError('Bitte ein Thema wählen.');
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await assignTopicToClass(classId, topicId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setTopicId('');
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <AssignForm
        topicId={topicId}
        choices={choices}
        pending={pending}
        onChange={setTopicId}
        onSubmit={handleAssign}
      />
      {error && (
        <p role="alert" className="text-destructive bg-destructive/10 rounded-md p-2 text-sm">
          {error}
        </p>
      )}
      <p className="text-muted-foreground text-xs">
        Beim Zuweisen werden alle veröffentlichten Bausteine des Themas (Lernmodule, Quiz,
        Abschlusstest, Präsentationen) der Klasse hinzugefügt.
      </p>
    </div>
  );
}
