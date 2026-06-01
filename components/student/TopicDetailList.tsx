import Link from 'next/link';
import type { StudentTopic, StudentTopicModule } from '@/lib/db/student-topics';
import { ACTIVITY_INFO } from '@/lib/activities';
import type { ModuleStatus } from '@/lib/db/student-modules-status';

// Lernpfad-Liste auf der Themen-Detailseite (Phase G4). Ein Item pro Modul
// mit Nummer, Icon, Titel, Status-Badge und Aktion-Button. Abschlusstest
// wird visuell abgesetzt — die Sperr-Logik (canStartAbschlusstest) kommt
// in Phase G5 dazu.

type Props = {
  topic: StudentTopic;
};

const STATUS_LABEL: Record<ModuleStatus, string> = {
  open: 'Offen',
  in_progress: 'Begonnen',
  returned: 'Überarbeiten',
  done: 'Erledigt',
};

const STATUS_BADGE: Record<ModuleStatus, string> = {
  open: 'bg-muted text-muted-foreground',
  in_progress: 'bg-primary/15 text-primary',
  returned: 'bg-amber-100 text-amber-900',
  done: 'bg-emerald-100 text-emerald-800',
};

const ACTION_LABEL: Record<ModuleStatus, string> = {
  open: 'Starten',
  in_progress: 'Weitermachen',
  returned: 'Überarbeiten',
  done: 'Wiederholen',
};

export function TopicDetailList({ topic }: Props) {
  if (topic.modules.length === 0) {
    return (
      <p className="text-muted-foreground rounded-md border border-dashed p-4 text-center text-sm">
        Dieses Thema hat noch keine Bausteine.
      </p>
    );
  }
  return (
    <ol className="space-y-2">
      {topic.modules.map((m, i) => (
        <PathItem key={m.moduleId} module={m} index={i + 1} />
      ))}
    </ol>
  );
}

function PathItem({ module: m, index }: { module: StudentTopicModule; index: number }) {
  const info = ACTIVITY_INFO[m.activityKind];
  const isAbschlusstest = m.activityKind === 'abschlusstest';
  const wrapperClass = isAbschlusstest
    ? 'flex items-center gap-3 rounded-md border-2 border-emerald-300 bg-emerald-50 px-3 py-3'
    : 'hover:bg-muted/40 flex items-center gap-3 rounded-md border px-3 py-2.5';
  return (
    <li className={wrapperClass}>
      <span className="text-muted-foreground w-6 text-right text-sm tabular-nums">{index}.</span>
      <span aria-hidden className="text-lg">
        {info.iconEmoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{m.title}</p>
        <p className="text-muted-foreground text-xs">{info.label}</p>
      </div>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${STATUS_BADGE[m.status]}`}>
        {STATUS_LABEL[m.status]}
      </span>
      <Link
        href={`/s/modul/${m.moduleId}`}
        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-8 shrink-0 items-center rounded-md px-3 text-xs font-medium"
      >
        {ACTION_LABEL[m.status]}
      </Link>
    </li>
  );
}
