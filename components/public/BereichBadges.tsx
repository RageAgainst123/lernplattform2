import { BookOpenIcon, FileTextIcon, PlayCircleIcon } from 'lucide-react';

// Indikatoren für die äußere Bereich-Karte: zeigen Themen-, Material-, Modul-
// Anzahl im Bereich. Wording bewusst anders als bei TopicBadges (3 Counts
// statt 2). Komponente bleibt klein — keine Komplexitäts-Aufblähung von
// TopicBadges nötig.

function plural(count: number, singular: string, pl: string): string {
  return `${count} ${count === 1 ? singular : pl}`;
}

function ariaLabel(topics: number, materials: number, modules: number): string {
  const parts: string[] = [];
  if (topics > 0) parts.push(plural(topics, 'Thema', 'Themen'));
  if (materials > 0) parts.push(plural(materials, 'Material', 'Materialien'));
  if (modules > 0) parts.push(plural(modules, 'Modul', 'Module'));
  return parts.join(', ');
}

type Props = {
  topicCount: number;
  materialCount: number;
  moduleCount: number;
};

function Pill({ icon, count }: { icon: React.ReactNode; count: number }) {
  return (
    <span
      className="bg-muted inline-flex items-center gap-1 rounded-full px-2 py-0.5"
      aria-hidden="true"
    >
      {icon}
      {count}
    </span>
  );
}

export function BereichBadges({ topicCount, materialCount, moduleCount }: Props) {
  if (topicCount === 0 && materialCount === 0 && moduleCount === 0) return null;
  return (
    <span
      className="text-muted-foreground flex shrink-0 items-center gap-2 text-xs"
      aria-label={ariaLabel(topicCount, materialCount, moduleCount)}
    >
      {topicCount > 0 && <Pill icon={<BookOpenIcon className="size-3.5" />} count={topicCount} />}
      {materialCount > 0 && (
        <Pill icon={<FileTextIcon className="size-3.5" />} count={materialCount} />
      )}
      {moduleCount > 0 && (
        <Pill icon={<PlayCircleIcon className="size-3.5" />} count={moduleCount} />
      )}
    </span>
  );
}
