'use client';

import { useMemo } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ThemaAccordion } from '@/components/public/ThemaAccordion';
import { BereichBadges } from '@/components/public/BereichBadges';
import { useNestedHashAccordion } from '@/components/public/useNestedHashAccordion';
import { KOMPETENZBEREICH_INFO } from '@/lib/curriculum';
import type { BereichWithTopics } from '@/lib/db/public-content-stufe';

// Äußere Aufklapp-Karten für die Stufen-Seite: ein Item pro Kompetenzbereich,
// im Panel ein inneres ThemaAccordion. Hash-Schema (#bereich oder
// #bereich/thema) wird vom Hook useNestedHashAccordion verwaltet.

function countMaterials(bereich: BereichWithTopics): number {
  return bereich.topics.reduce((sum, t) => sum + t.materials.length, 0);
}
function countModules(bereich: BereichWithTopics): number {
  return bereich.topics.reduce((sum, t) => sum + t.modules.length, 0);
}

function BereichHeader({ bereich }: { bereich: BereichWithTopics }) {
  const info = KOMPETENZBEREICH_INFO[bereich.bereich];
  return (
    <span className="flex flex-1 items-start justify-between gap-3 pr-2">
      <span className="min-w-0 break-words hyphens-auto">
        <span className="block text-lg font-medium">{info.label}</span>
        <span className="text-muted-foreground mt-0.5 block text-sm font-normal">
          {info.description}
        </span>
      </span>
      <BereichBadges
        topicCount={bereich.topics.length}
        materialCount={countMaterials(bereich)}
        moduleCount={countModules(bereich)}
      />
    </span>
  );
}

function BereichPanel({
  bereich,
  studentLoggedIn,
  topicValue,
  onTopicChange,
}: {
  bereich: BereichWithTopics;
  studentLoggedIn: boolean;
  topicValue: string[];
  onTopicChange: (next: string[]) => void;
}) {
  if (bereich.topics.length === 0) {
    return (
      <p className="text-muted-foreground py-3 text-sm">
        Für diesen Bereich gibt es noch keine Inhalte.
      </p>
    );
  }
  return (
    <div className="pt-2">
      <ThemaAccordion
        topics={bereich.topics}
        studentLoggedIn={studentLoggedIn}
        value={topicValue}
        onValueChange={onTopicChange}
      />
    </div>
  );
}

export function BereichAccordion({
  bereiche,
  studentLoggedIn = false,
}: {
  bereiche: BereichWithTopics[];
  studentLoggedIn?: boolean;
}) {
  const bereichSlugs = useMemo(() => bereiche.map((b) => b.bereich), [bereiche]);
  const topicsByBereich = useMemo(() => {
    const out: Record<string, string[]> = {};
    for (const b of bereiche) out[b.bereich] = b.topics.map((t) => t.slug);
    return out;
  }, [bereiche]);

  const { bereichValue, topicValueByBereich, onBereichChange, onTopicChange } =
    useNestedHashAccordion(bereichSlugs, topicsByBereich);

  return (
    <Accordion
      multiple
      value={bereichValue}
      onValueChange={onBereichChange}
      className="rounded-xl border"
    >
      {bereiche.map((b) => (
        <AccordionItem
          key={b.bereich}
          value={b.bereich}
          id={b.bereich}
          className="scroll-mt-20 px-4"
        >
          <AccordionTrigger className="min-h-14 py-4 text-left hover:no-underline">
            <BereichHeader bereich={b} />
          </AccordionTrigger>
          <AccordionContent>
            <BereichPanel
              bereich={b}
              studentLoggedIn={studentLoggedIn}
              topicValue={topicValueByBereich[b.bereich] ?? []}
              onTopicChange={(next) => onTopicChange(b.bereich, next)}
            />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
