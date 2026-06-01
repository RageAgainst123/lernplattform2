import Link from 'next/link';
import type { StudentTopic, StudentTopicModule } from '@/lib/db/student-topics';
import { ACTIVITY_INFO } from '@/lib/activities';
import type { ModuleStatus } from '@/lib/db/student-modules-status';
import { getAbschlusstestUnlock } from '@/lib/db/student-topics-status';

// Lernpfad-Liste auf der Themen-Detailseite (Phase G4 + G5). Ein Item pro
// Modul mit Nummer, Icon, Titel, Status-Badge und Aktion-Button.
// Abschlusstest visuell abgesetzt; bei nicht erfüllten Voraussetzungen
// wird statt des Aktion-Buttons ein Schloss + Hinweis welche Lernmodule
// noch offen sind angezeigt.

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
  // Phase G5: Abschlusstest-Voraussetzung einmal pro Render berechnen — die
  // Liste der fehlenden Lernmodul-Titel wird im Sperr-Hinweis angezeigt.
  const unlock = getAbschlusstestUnlock(
    topic.modules.map((m) => ({
      title: m.title,
      status: m.status,
      activityKind: m.activityKind,
    }))
  );
  return (
    <ol className="space-y-2">
      {topic.modules.map((m, i) => (
        <PathItem key={m.moduleId} module={m} index={i + 1} unlock={unlock} />
      ))}
    </ol>
  );
}

function PathItem({
  module: m,
  index,
  unlock,
}: {
  module: StudentTopicModule;
  index: number;
  unlock: { allowed: boolean; missingTitles: string[] };
}) {
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
      <PathItemAction module={m} unlock={unlock} />
    </li>
  );
}

// Rechte Hälfte des Listen-Items: Status-Badge + Aktion oder Sperr-Hinweis.
// Eigene Komponente um die ESLint-max-lines-per-function-Grenze einzuhalten.
function PathItemAction({
  module: m,
  unlock,
}: {
  module: StudentTopicModule;
  unlock: { allowed: boolean; missingTitles: string[] };
}) {
  const isAbschlusstest = m.activityKind === 'abschlusstest';
  if (isAbschlusstest && !unlock.allowed) {
    const remaining = unlock.missingTitles.length;
    return (
      <div className="text-right">
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
          🔒 Gesperrt
        </span>
        <p className="text-muted-foreground mt-1 text-xs">
          Noch {remaining} {remaining === 1 ? 'Lernmodul' : 'Lernmodule'} offen
        </p>
      </div>
    );
  }
  return (
    <>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${STATUS_BADGE[m.status]}`}>
        {STATUS_LABEL[m.status]}
      </span>
      <Link
        href={`/s/modul/${m.moduleId}`}
        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-8 shrink-0 items-center rounded-md px-3 text-xs font-medium"
      >
        {ACTION_LABEL[m.status]}
      </Link>
    </>
  );
}
