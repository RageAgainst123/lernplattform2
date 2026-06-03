import type { Metadata } from 'next';
import Link from 'next/link';
import { requireStudentSession } from '@/lib/auth/student-auth';
import { getProgress, getStudentModule } from '@/lib/db/student-modules';
import { isGraded, blockResult, type BlockAnswer } from '@/lib/blocks/evaluate';
import { buttonVariants } from '@/components/ui/button';
import { SoloRunSummary } from '@/components/blocks/SoloRunSummary';
import {
  AnswerOverviewCard,
  ModuleNotAvailable,
  ReflectionsCard,
  ScoreHeroCard,
  blockShortLabel,
  type ResultItem,
} from '@/components/blocks/ModuleDoneCards';

export const metadata: Metadata = {
  title: 'Geschafft',
};

// Quiz-Endseite (R1.1):
//   • Score-Hero (X von Y richtig + Prozent + Solo-Punkte)
//   • Antwort-Übersicht pro Block (✅/❌)
//   • „Falsche Fragen wiederholen"-Button (R1.4)
//   • Reflexionen separat aufgelistet
//
// Solo-Punkte kommen via sessionStorage rein (siehe ModuleRunner + R1.3).
// Server-seitig kennen wir sie NICHT — bewusst (Solo = Übung, kein
// Wettbewerb). Daher ist die Score-Anzeige + Antwort-Übersicht server-side
// (aus student_progress + module.content), die Punkte-Anzeige client-side
// in <SoloRunSummary />.

export default async function ModuleDonePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireStudentSession();
  const { id } = await params;
  const moduleData = await getStudentModule(id, session.classId);
  const progress = await getProgress(session.studentCodeId, id);

  if (!moduleData) {
    return <ModuleNotAvailable />;
  }

  const blocks = moduleData.content.blocks;
  const answers: Record<string, BlockAnswer> = progress?.answers ?? {};
  const items: ResultItem[] = blocks.filter(isGraded).map((block, i) => ({
    id: block.id,
    label: blockShortLabel(block, i + 1),
    result: blockResult(block, answers[block.id]),
  }));
  const reflectionCount = blocks.filter((b) => b.type === 'reflection').length;
  const correctCount = items.filter((it) => it.result === 'correct').length;
  const wrongCount = items.filter((it) => it.result === 'wrong').length;
  const total = items.length;
  const percent = total > 0 ? Math.round((correctCount / total) * 100) : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <ScoreHeroCard
        moduleTitle={moduleData.title}
        correctCount={correctCount}
        total={total}
        percent={percent}
      >
        <SoloRunSummary moduleId={id} />
      </ScoreHeroCard>

      {items.length > 0 && (
        <AnswerOverviewCard moduleId={id} items={items} wrongCount={wrongCount} />
      )}

      {reflectionCount > 0 && <ReflectionsCard count={reflectionCount} />}

      <Link href="/s" className={`${buttonVariants({ variant: 'outline' })} self-center`}>
        Zurück zur Übersicht
      </Link>
    </div>
  );
}
