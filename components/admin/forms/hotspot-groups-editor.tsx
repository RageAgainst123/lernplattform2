'use client';

import type { HotspotBlock } from '@/lib/schemas/blocks';
import { Button } from '@/components/ui/button';
import { AddButton, ItemAction, TextInput, makeOptionId } from './form-helpers';

// Admin-Verwaltung der Hotspot-Gruppen. Modus-Schalter Einfach/Gruppen, Gruppen-
// CRUD und die Wahl der „aktuellen Gruppe" (in die neue Zonen einsortiert
// werden). Ausgelagert aus HotspotForm.

type Group = NonNullable<HotspotBlock['groups']>[number];

export function HotspotGroupsEditor({
  value,
  currentGroupId,
  onCurrentGroupChange,
  onChange,
}: {
  value: HotspotBlock;
  currentGroupId: string | undefined;
  onCurrentGroupChange: (id: string | undefined) => void;
  onChange: (next: HotspotBlock) => void;
}) {
  const groups = value.groups ?? [];
  const grouped = groups.length > 0;

  function enableGroups() {
    const first: Group = { id: makeOptionId(groups, 'g'), label: 'Gruppe 1' };
    onChange({ ...value, groups: [first] });
    onCurrentGroupChange(first.id);
  }

  function disableGroups() {
    // Gruppen entfernen + groupId von allen Zonen lösen → zurück zum Einfach-Modus.
    onChange({
      ...value,
      groups: undefined,
      areas: value.areas.map((a) => ({ ...a, groupId: undefined })),
    });
    onCurrentGroupChange(undefined);
  }

  function addGroup() {
    const g: Group = { id: makeOptionId(groups, 'g'), label: `Gruppe ${groups.length + 1}` };
    onChange({ ...value, groups: [...groups, g] });
    onCurrentGroupChange(g.id);
  }

  function updateGroup(id: string, label: string) {
    onChange({ ...value, groups: groups.map((g) => (g.id === id ? { ...g, label } : g)) });
  }

  function removeGroup(id: string) {
    const nextGroups = groups.filter((g) => g.id !== id);
    onChange({
      ...value,
      groups: nextGroups.length > 0 ? nextGroups : undefined,
      // Zonen dieser Gruppe werden gruppenlos.
      areas: value.areas.map((a) => (a.groupId === id ? { ...a, groupId: undefined } : a)),
    });
    if (currentGroupId === id) onCurrentGroupChange(nextGroups[0]?.id);
  }

  if (!grouped) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground">Modus: Einfach (eine Frage).</span>
        <Button type="button" variant="outline" size="sm" onClick={enableGroups}>
          In Gruppen aufteilen
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-md border p-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">Gruppen (eine Frage pro Gruppe)</span>
        <Button type="button" variant="ghost" size="sm" onClick={disableGroups}>
          Gruppen entfernen
        </Button>
      </div>
      <ul className="space-y-2">
        {groups.map((g) => (
          <li key={g.id} className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1 text-xs">
              <input
                type="radio"
                name={`${value.id}-current-group`}
                checked={currentGroupId === g.id}
                onChange={() => onCurrentGroupChange(g.id)}
                aria-label={`Aktuelle Gruppe: ${g.label}`}
              />
              aktiv
            </label>
            <TextInput
              id={`group-${g.id}`}
              value={g.label}
              onChange={(v) => updateGroup(g.id, v)}
              placeholder="Gruppen-Name"
            />
            <ItemAction onClick={() => removeGroup(g.id)} label="✕" tone="destructive" />
          </li>
        ))}
      </ul>
      {groups.length < 6 && <AddButton onClick={addGroup}>Gruppe hinzufügen</AddButton>}
      <p className="text-muted-foreground text-xs">
        Neue Zonen landen in der mit „aktiv“ markierten Gruppe. Jede Gruppe wird als eigener Schritt
        gefragt („Tippe alle … an“).
      </p>
    </div>
  );
}
