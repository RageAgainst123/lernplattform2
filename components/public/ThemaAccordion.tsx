'use client';

import type { TopicWithContent } from '@/lib/db/public-content';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { MaterialItem } from '@/components/public/MaterialItem';
import { PublicModuleItem } from '@/components/public/PublicModuleItem';
import { TopicBadges } from '@/components/public/TopicBadges';
import { useHashAccordion } from '@/components/public/useHashAccordion';

// Aufklappbare Themen-Liste für die Bereich-Seite. Multi-open (mehrere Themen
// parallel offen), Hash-Permalink (#thema-slug), Materialien + Module inline.

function TopicPanel({ topic }: { topic: TopicWithContent }) {
  return (
    <div className="space-y-6 pt-2">
      {topic.materials.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-base font-medium">Materialien</h3>
          <div className="space-y-3">
            {topic.materials.map((m) => (
              <MaterialItem key={m.id} material={m} />
            ))}
          </div>
        </section>
      )}
      {topic.modules.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-base font-medium">Module</h3>
          <div className="space-y-3">
            {topic.modules.map((m) => (
              <PublicModuleItem key={m.id} module={m} />
            ))}
          </div>
        </section>
      )}
      {topic.materials.length === 0 && topic.modules.length === 0 && (
        <p className="text-muted-foreground text-sm">Noch keine Inhalte zu diesem Thema.</p>
      )}
    </div>
  );
}

type ThemaAccordionProps = {
  topics: TopicWithContent[];
  // Controlled-Modus (z.B. wenn Eltern den Hash übergreifend verwaltet).
  // Beide Props müssen gesetzt sein, sonst greift der uncontrolled-Default
  // mit eigenem useHashAccordion (siehe ThemaAccordionStandalone).
  value?: string[];
  onValueChange?: (next: string[]) => void;
};

// Reine Render-Schicht — KEIN Hash-Hook, KEIN State. Eltern reichen value+onChange.
function ThemaAccordionView({
  topics,
  value,
  onValueChange,
}: {
  topics: TopicWithContent[];
  value: string[];
  onValueChange: (next: string[]) => void;
}) {
  return (
    <Accordion multiple value={value} onValueChange={onValueChange} className="rounded-xl border">
      {topics.map((topic) => (
        <AccordionItem
          key={topic.slug}
          value={topic.slug}
          id={topic.slug}
          className="scroll-mt-20 px-4"
        >
          <AccordionTrigger className="min-h-12 py-3 text-base font-medium hover:no-underline">
            <span className="flex flex-1 items-center justify-between gap-3 pr-2">
              <span className="break-words hyphens-auto">{topic.topic}</span>
              <TopicBadges
                materialCount={topic.materials.length}
                moduleCount={topic.modules.length}
              />
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <TopicPanel topic={topic} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

// Uncontrolled-Wrapper: nutzt useHashAccordion intern. Nur dann gemountet,
// wenn der Eltern KEIN value/onChange reicht — Hooks-Reihenfolge bleibt
// stabil, weil das eine eigene Komponente ist.
function ThemaAccordionStandalone({ topics }: { topics: TopicWithContent[] }) {
  const { value, onValueChange } = useHashAccordion(topics.map((t) => t.slug));
  return <ThemaAccordionView topics={topics} value={value} onValueChange={onValueChange} />;
}

export function ThemaAccordion({ topics, value, onValueChange }: ThemaAccordionProps) {
  if (value !== undefined && onValueChange !== undefined) {
    return <ThemaAccordionView topics={topics} value={value} onValueChange={onValueChange} />;
  }
  return <ThemaAccordionStandalone topics={topics} />;
}
