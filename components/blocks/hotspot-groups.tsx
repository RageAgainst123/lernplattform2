'use client';

import { useMemo, useState } from 'react';
import type { HotspotBlock as HotspotBlockType } from '@/lib/schemas/blocks';
import { Button } from '@/components/ui/button';
import { HotspotZone } from '@/components/blocks/hotspot-overlay';
import { HotspotHiddenSurface } from '@/components/blocks/hotspot-hidden';
import { HotspotFeedbackList } from '@/components/blocks/hotspot-feedback';
import { HotspotImageStage } from '@/components/blocks/hotspot-zoom';

// Gruppen-Modus des Hotspot-Blocks: ein Bild, mehrere Frage-Schritte
// („Tippe alle Eingabegeräte an" → prüfen → „Tippe alle Ausgabegeräte an").
// Der Schritt-Zustand (welche Gruppe, schon geprüft?) ist lokaler UI-State und
// gehört NICHT in die Antwort. Die Antwort bleibt ein flaches string[] der
// angetippten areaIds (additiv akkumuliert).

type Group = NonNullable<HotspotBlockType['groups']>[number];

type Props = {
  block: HotspotBlockType;
  answer: string[];
  checked: boolean;
  readOnly?: boolean;
  onSelect: (next: string[]) => void;
};

// Bild + Zonen einer Gruppe (aktive Gruppe + gruppenlose Distraktoren). `reveal`
// schaltet die grün/rot/gelb-Bewertung für genau diese Gruppe ein.
function GroupImage({
  block,
  group,
  picked,
  reveal,
  locked,
  onToggle,
}: {
  block: HotspotBlockType;
  group: Group;
  picked: Set<string>;
  reveal: boolean;
  locked: boolean;
  onToggle: (id: string) => void;
}) {
  const zones = block.areas.filter((a) => a.groupId === group.id || a.groupId === undefined);
  // Versteckte Zonen + noch nicht aufgedeckt → Frei-Klick-Fläche für genau die
  // Zonen dieses Schritts. Beim Aufdecken (reveal) zeigt der reguläre Pfad die
  // Rahmen grün/rot/gelb.
  if (block.revealZones === false && !reveal) {
    return (
      <HotspotHiddenSurface
        imageUrl={block.imageUrl}
        imageAlt={block.imageAlt}
        zones={zones}
        picked={picked}
        locked={locked}
        maxClicks={block.maxClicks}
        zoomable={block.zoomable === true}
        onToggle={onToggle}
      />
    );
  }
  return (
    <HotspotImageStage
      imageUrl={block.imageUrl}
      imageAlt={block.imageAlt}
      zoomable={block.zoomable === true}
    >
      {zones.map((area, i) => (
        <HotspotZone
          key={area.id}
          area={area}
          picked={picked.has(area.id)}
          checked={reveal}
          locked={locked}
          index={i}
          onToggle={onToggle}
        />
      ))}
    </HotspotImageStage>
  );
}

// Review-Ansicht (checked || readOnly, z.B. Lehrer:innen-Korrektur): alle Gruppen
// untereinander, aufgedeckt + gesperrt.
function ReviewAll({ block, picked }: { block: HotspotBlockType; picked: Set<string> }) {
  const groups = block.groups ?? [];
  return (
    <div className="space-y-4">
      <p className="text-lg font-medium">{block.instruction}</p>
      {groups.map((g) => (
        <div key={g.id} className="space-y-2">
          <p className="font-medium">Tippe alle {g.label} an</p>
          <GroupImage block={block} group={g} picked={picked} reveal locked onToggle={() => {}} />
          <HotspotFeedbackList
            areas={block.areas.filter((a) => a.groupId === g.id || a.groupId === undefined)}
          />
        </div>
      ))}
    </div>
  );
}

// Fußzeile mit Prüfen/Weiter-Steuerung im interaktiven Gruppen-Durchlauf.
function StepControls({
  revealed,
  isLast,
  onCheck,
  onNext,
}: {
  revealed: boolean;
  isLast: boolean;
  onCheck: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex justify-end gap-2">
      {!revealed ? (
        <Button size="sm" onClick={onCheck}>
          Prüfen
        </Button>
      ) : isLast ? (
        <span className="text-muted-foreground self-center text-sm">Alle Schritte erledigt ✓</span>
      ) : (
        <Button size="sm" onClick={onNext}>
          Weiter →
        </Button>
      )}
    </div>
  );
}

// Prominenter Aufgaben-Banner pro Schritt — zeigt klar, was JETZT zu tun ist
// (war vorher kleine graue Zeile oben rechts, leicht übersehen).
function StepBanner({ step, total, label }: { step: number; total: number; label: string }) {
  return (
    <div className="border-primary/30 bg-primary/10 flex items-center gap-3 rounded-lg border p-3">
      <span className="bg-primary shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-white">
        Schritt {step + 1} / {total}
      </span>
      <span className="text-primary text-lg font-bold">👉 Tippe alle {label} an</span>
    </div>
  );
}

export function HotspotGroupRunner({ block, answer, checked, readOnly = false, onSelect }: Props) {
  const groups = block.groups ?? [];
  const picked = useMemo(() => new Set(answer), [answer]);
  const [step, setStep] = useState(0);
  const [revealed, setRevealed] = useState(false);

  if (checked || readOnly) {
    return <ReviewAll block={block} picked={picked} />;
  }

  const group = groups[Math.min(step, groups.length - 1)];
  const isLast = step >= groups.length - 1;

  function toggle(id: string) {
    if (revealed) return;
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelect([...next]);
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">{block.instruction}</p>
      <StepBanner step={step} total={groups.length} label={group.label} />
      <GroupImage
        block={block}
        group={group}
        picked={picked}
        reveal={revealed}
        locked={revealed}
        onToggle={toggle}
      />
      <StepControls
        revealed={revealed}
        isLast={isLast}
        onCheck={() => setRevealed(true)}
        onNext={() => {
          setStep((s) => s + 1);
          setRevealed(false);
        }}
      />
    </div>
  );
}
