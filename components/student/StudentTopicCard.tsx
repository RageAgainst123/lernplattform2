import Link from 'next/link';
import type { StudentTopic } from '@/lib/db/student-topics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TopicProgressBar } from './TopicProgressBar';

// Themen-Karte auf dem Schüler-Dashboard (Phase G4). Großer Titel, kurzer
// Untertitel (Stufe), Beschreibung, Fortschrittsbalken, Status-Badge,
// „Weitermachen" oder „Starten"-Link je nach Status.

type Props = {
  topic: StudentTopic;
};

const STATUS_LABEL: Record<StudentTopic['status'], string> = {
  open: 'Noch nicht begonnen',
  in_progress: 'In Bearbeitung',
  done: 'Alles erledigt',
};

const STATUS_BADGE: Record<StudentTopic['status'], string> = {
  open: 'bg-muted text-muted-foreground',
  in_progress: 'bg-primary/15 text-primary',
  done: 'bg-emerald-100 text-emerald-800',
};

const ACTION_LABEL: Record<StudentTopic['status'], string> = {
  open: 'Starten',
  in_progress: 'Weitermachen',
  done: 'Wiederholen',
};

export function StudentTopicCard({ topic }: Props) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="text-xl" aria-hidden>
                📚
              </span>
              {topic.label}
            </CardTitle>
            {topic.schulstufe && (
              <p className="text-muted-foreground text-xs">{topic.schulstufe}. Stufe</p>
            )}
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${STATUS_BADGE[topic.status]}`}
          >
            {STATUS_LABEL[topic.status]}
          </span>
        </div>
        {topic.description && (
          <p className="text-muted-foreground mt-2 text-sm">{topic.description}</p>
        )}
      </CardHeader>
      <CardContent className="mt-auto space-y-3 pt-3">
        <TopicProgressBar done={topic.done} total={topic.total} />
        <div className="flex justify-end">
          <Link
            href={`/s/thema/${topic.slug}`}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center rounded-md px-3 text-sm font-medium"
          >
            {ACTION_LABEL[topic.status]} →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
