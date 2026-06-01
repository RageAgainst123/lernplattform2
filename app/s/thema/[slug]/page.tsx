import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { requireStudentSession } from '@/lib/auth/student-auth';
import { getAssignedTopicBySlug } from '@/lib/db/student-topics';
import { TopicProgressBar } from '@/components/student/TopicProgressBar';
import { TopicDetailList } from '@/components/student/TopicDetailList';

// Themen-Detailseite für Schüler:innen (Phase G4). Header mit Titel +
// Fortschrittsbalken, darunter der Lernpfad als nummerierte Liste mit
// pro-Modul-Status und Aktion-Button. Präsentationen sind nicht sichtbar
// (filtert getAssignedTopicsForStudent bereits raus).

export const metadata: Metadata = {
  title: 'Thema — Mein Bereich',
};

export default async function StudentTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await requireStudentSession();
  const { slug } = await params;
  const topic = await getAssignedTopicBySlug(session.classId, session.studentCodeId, slug);
  if (!topic) notFound();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-10">
      <Link href="/s" className="text-muted-foreground text-sm hover:underline">
        ← Zurück zu deinen Themen
      </Link>
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <span aria-hidden>📚</span>
          {topic.label}
        </h1>
        {topic.schulstufe && (
          <p className="text-muted-foreground text-sm">{topic.schulstufe}. Stufe</p>
        )}
        {topic.description && <p className="mt-2 text-sm">{topic.description}</p>}
      </header>
      <TopicProgressBar done={topic.done} total={topic.total} />
      <section>
        <h2 className="mb-3 text-lg font-medium">Lernpfad</h2>
        <TopicDetailList topic={topic} />
      </section>
    </div>
  );
}
