'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { AssignedModuleForTeacher } from '@/lib/db/class-modules';
import type { PublishedModuleOption } from '@/lib/db/modules';
import { assignModuleToClass, unassignModuleFromClass } from '@/lib/db/class-module-actions';
import { Button } from '@/components/ui/button';
import { AssignedModulesList } from '@/components/teacher/AssignedModulesList';

// UI für die Lehrer:innen-Modul-Zuweisung. Oben Form (Dropdown + optionales
// Fälligkeitsdatum + „Zuweisen"-Button), darunter Liste der zugewiesenen
// Module mit Link auf den Klassen-Fortschritt + Entfernen-Aktion.

type Props = {
  classId: string;
  assigned: AssignedModuleForTeacher[];
  available: PublishedModuleOption[];
};

function ModuleSelect({
  choices,
  value,
  onChange,
  disabled,
}: {
  choices: PublishedModuleOption[];
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  const placeholder =
    choices.length === 0 ? '— alle veröffentlichten Module sind zugewiesen —' : '— Modul wählen —';
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="assign-module" className="text-sm font-medium">
        Modul auswählen
      </label>
      <select
        id="assign-module"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || choices.length === 0}
        className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
      >
        <option value="">{placeholder}</option>
        {choices.map((m) => (
          <option key={m.id} value={m.id}>
            {m.schulstufe ? `${m.schulstufe}. SSt. · ` : ''}
            {m.title}
          </option>
        ))}
      </select>
    </div>
  );
}

function DueDateField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="assign-due" className="text-sm font-medium">
        Fälligkeit (optional)
      </label>
      <input
        id="assign-due"
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="border-input bg-background h-9 rounded-md border px-3 text-sm"
      />
    </div>
  );
}

function ThresholdField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="assign-thr" className="text-sm font-medium">
        Bestehen ab (%)
      </label>
      <input
        id="assign-thr"
        type="number"
        min={0}
        max={100}
        value={value}
        placeholder="—"
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="border-input bg-background h-9 w-24 rounded-md border px-3 text-sm"
      />
    </div>
  );
}

function AssignForm({
  choices,
  pending,
  onAssign,
}: {
  choices: PublishedModuleOption[];
  pending: boolean;
  onAssign: (moduleId: string, dueDate: string, threshold: string) => void;
}) {
  const [moduleId, setModuleId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [threshold, setThreshold] = useState('');
  return (
    <form
      className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        onAssign(moduleId, dueDate, threshold);
        setModuleId('');
        setDueDate('');
        setThreshold('');
      }}
    >
      <ModuleSelect choices={choices} value={moduleId} onChange={setModuleId} disabled={pending} />
      <DueDateField value={dueDate} onChange={setDueDate} disabled={pending} />
      <ThresholdField value={threshold} onChange={setThreshold} disabled={pending} />
      <Button type="submit" disabled={pending || !moduleId}>
        Zuweisen
      </Button>
    </form>
  );
}

// Kapselt State + Server-Action-Aufrufe der Zuweisungs-UI, damit die
// Komponente selbst schlank bleibt (ESLint max-lines-per-function).
function useAssignmentActions(classId: string) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAssign(moduleId: string, dueDate: string, threshold: string) {
    if (!moduleId) {
      setError('Bitte ein Modul wählen.');
      return;
    }
    const parsed = threshold.trim() === '' ? null : Number(threshold);
    if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0 || parsed > 100)) {
      setError('Schwelle muss zwischen 0 und 100 liegen.');
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await assignModuleToClass(classId, moduleId, dueDate || null, parsed);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  function handleRemove(modId: string, title: string) {
    if (!confirm(`Modul "${title}" wirklich aus dieser Klasse entfernen?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await unassignModuleFromClass(classId, modId);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return { error, pending, handleAssign, handleRemove };
}

export function ModuleAssignmentPanel({ classId, assigned, available }: Props) {
  const { error, pending, handleAssign, handleRemove } = useAssignmentActions(classId);
  const assignedSet = useMemo(() => new Set(assigned.map((a) => a.moduleId)), [assigned]);
  const choices = useMemo(
    () => available.filter((m) => !assignedSet.has(m.id)),
    [available, assignedSet]
  );

  return (
    <div className="flex flex-col gap-5">
      <AssignForm choices={choices} pending={pending} onAssign={handleAssign} />
      {error && (
        <p role="alert" className="text-destructive bg-destructive/10 rounded-md p-2 text-sm">
          {error}
        </p>
      )}
      <AssignedModulesList
        classId={classId}
        assigned={assigned}
        pending={pending}
        onRemove={handleRemove}
      />
    </div>
  );
}
