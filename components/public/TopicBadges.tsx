import { FileTextIcon, PlayCircleIcon } from 'lucide-react';

// Kompakte Indikatoren rechts im Accordion-Trigger: zeigen vor dem Aufklappen
// wie viele Materialien (PDFs) und Module ein Thema enthält. Reduziert
// „Leerklicks" auf Themen ohne passenden Inhalt.

function pluralLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function ariaLabel(materialCount: number, moduleCount: number): string {
  const parts: string[] = [];
  if (materialCount > 0) parts.push(pluralLabel(materialCount, 'Material', 'Materialien'));
  if (moduleCount > 0) parts.push(pluralLabel(moduleCount, 'Modul', 'Module'));
  return parts.join(', ');
}

export function TopicBadges({
  materialCount,
  moduleCount,
}: {
  materialCount: number;
  moduleCount: number;
}) {
  if (materialCount === 0 && moduleCount === 0) return null;
  return (
    <span
      className="text-muted-foreground flex shrink-0 items-center gap-2 text-xs"
      aria-label={ariaLabel(materialCount, moduleCount)}
    >
      {materialCount > 0 && (
        <span
          className="bg-muted inline-flex items-center gap-1 rounded-full px-2 py-0.5"
          aria-hidden="true"
        >
          <FileTextIcon className="size-3.5" />
          {materialCount}
        </span>
      )}
      {moduleCount > 0 && (
        <span
          className="bg-muted inline-flex items-center gap-1 rounded-full px-2 py-0.5"
          aria-hidden="true"
        >
          <PlayCircleIcon className="size-3.5" />
          {moduleCount}
        </span>
      )}
    </span>
  );
}
