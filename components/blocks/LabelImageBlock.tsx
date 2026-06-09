'use client';

import type { LabelImageBlock as LabelImageBlockType } from '@/lib/schemas/blocks';
import { LabelPool } from '@/components/blocks/label-image-pool';
import { LabelHiddenStage, LabelMarkers } from '@/components/blocks/label-image-stages';
import { useLabelImage } from '@/components/blocks/use-label-image';

// Bild-Beschriften: die Schüler:in ordnet jeder Stelle im Bild den richtigen
// Begriff zu. Workflow: Zone (Marker) tippen → aktiv → unten den passenden
// Begriff-Chip tippen → er landet auf der Zone. „×" legt zurück. answer =
// Record<zoneId, Begriff>. checked = grün/rot, readOnly = gesperrt.
//
// Sichtbarer Modus (revealZones !== false): nummerierte Marker zeigen die
// Stellen. Versteckter Modus: keine Marker → erst Stelle frei anklicken (Zone
// finden), dann Begriff wählen. Nach dem Prüfen werden die Zonen aufgedeckt.

type Props = {
  block: LabelImageBlockType;
  assignment: Record<string, string>; // zoneId → Begriff
  checked: boolean;
  readOnly?: boolean;
  onAssign: (next: Record<string, string>) => void;
};

export function LabelImageBlock({ block, assignment, checked, readOnly = false, onAssign }: Props) {
  const locked = checked || readOnly;
  const s = useLabelImage(block, assignment, locked, onAssign);
  const hidden = block.revealZones === false && !locked;

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium">{block.instruction}</p>
      {hidden ? (
        <LabelHiddenStage
          block={block}
          innerRef={s.ref}
          onFreeClick={s.onFreeClick}
          active={s.activeZone}
        />
      ) : (
        <LabelMarkers
          block={block}
          assignment={assignment}
          active={s.activeZone}
          checked={checked}
          locked={locked}
          onSelect={s.selectZone}
          onUnassign={s.unassign}
        />
      )}
      {!locked && (
        <LabelPool
          labels={s.poolLabels}
          armed={s.activeZone !== null}
          activeHint={s.activeHint}
          onPick={s.pickLabel}
        />
      )}
    </div>
  );
}
