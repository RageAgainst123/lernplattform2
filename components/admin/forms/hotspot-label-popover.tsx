'use client';

import { useState } from 'react';
import type { HotspotBlock } from '@/lib/schemas/blocks';
import { Button } from '@/components/ui/button';

// Label-Popup des Hotspot-Editors. Ausgelagert aus hotspot-editor.tsx wegen der
// Datei-Zeilen-Grenze. Erscheint direkt nach dem Setzen einer Zone, beschriftet
// sie und (optional) ordnet sie einer Gruppe zu / legt eine neue Gruppe an.

type Area = HotspotBlock['areas'][number];
type Group = { id: string; label: string };

// Gruppen-Zeile: Auswahl der Gruppe (falls vorhanden) + „＋ Neue Gruppe".
function LabelGroupRow({
  area,
  groups,
  canAddGroup,
  onAssign,
  onCreate,
}: {
  area: Area;
  groups: Group[];
  canAddGroup: boolean;
  onAssign: (groupId: string | undefined) => void;
  onCreate: () => void;
}) {
  return (
    <div className="mt-2 flex items-center gap-1">
      {groups.length > 0 && (
        <select
          value={area.groupId ?? ''}
          onChange={(e) => onAssign(e.target.value || undefined)}
          aria-label="Gruppe der Zone"
          className="border-input bg-background h-7 min-w-0 flex-1 rounded-md border px-1 text-xs"
        >
          <option value="">– ohne Gruppe –</option>
          {groups.map((g, i) => (
            <option key={g.id} value={g.id}>
              {i + 1}. {g.label}
            </option>
          ))}
        </select>
      )}
      {canAddGroup && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onCreate}
          aria-label="Neue Gruppe"
        >
          ＋ Gruppe
        </Button>
      )}
    </div>
  );
}

// Kleines Label-Popup direkt an einer gerade gesetzten Zone. Autofokus, Enter
// speichert, Esc/Abbrechen schließt (ohne Label). Optional Gruppen-Zeile. Wird
// über dem Bild positioniert (x,y = Mittelpunkt der Zone in %).
export function LabelPopover({
  area,
  groups = [],
  canAddGroup = false,
  onSave,
  onAssignGroup,
  onCreateGroup,
  onClose,
}: {
  area: Area;
  groups?: Group[];
  canAddGroup?: boolean;
  onSave: (label: string) => void;
  onAssignGroup?: (groupId: string | undefined) => void;
  onCreateGroup?: () => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(area.label ?? '');
  // Horizontal an den Rändern einfangen, damit das Popup im Bild bleibt.
  const left = Math.min(82, Math.max(18, area.x * 100));
  // Bei Zonen im oberen Drittel das Popup UNTER die Zone klappen (sonst würde es
  // vom overflow-hidden-Container oben abgeschnitten); sonst darüber.
  const below = area.y < 0.3;
  const top = area.y * 100;
  const transform = below ? 'translate(-50%, 8px)' : 'translate(-50%, calc(-100% - 8px))';
  const showGroups = Boolean(onAssignGroup && onCreateGroup);
  return (
    <div
      style={{ left: `${left}%`, top: `${top}%`, transform }}
      className="bg-background absolute z-10 w-64 rounded-md border p-2 shadow-lg"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <p className="text-muted-foreground mb-1 text-xs">Was ist das? (Label)</p>
      <input
        autoFocus
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onSave(text.trim());
          } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
          }
        }}
        placeholder="z.B. Laptop"
        className="border-input bg-background h-8 w-full rounded-md border px-2 text-sm"
      />
      {showGroups && (
        <LabelGroupRow
          area={area}
          groups={groups}
          canAddGroup={canAddGroup}
          onAssign={onAssignGroup!}
          onCreate={onCreateGroup!}
        />
      )}
      <div className="mt-2 flex justify-end gap-1">
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          Abbrechen
        </Button>
        <Button type="button" size="sm" onClick={() => onSave(text.trim())}>
          OK
        </Button>
      </div>
    </div>
  );
}
