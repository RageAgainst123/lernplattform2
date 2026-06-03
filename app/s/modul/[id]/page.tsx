import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { requireStudentSession } from '@/lib/auth/student-auth';
import {
  getProgress,
  getStudentModule,
  type StudentModule,
  type ModuleProgress,
} from '@/lib/db/student-modules';
import { getAssignedTopicsForStudent } from '@/lib/db/student-topics';
import { getAbschlusstestUnlock } from '@/lib/db/student-topics-status';
import { saveProgress, saveWorksheetDraft, submitWorksheet } from '@/lib/db/progress-action';
import { blockResult, isGraded, type BlockAnswer } from '@/lib/blocks/evaluate';
import { ModuleRunner } from '@/components/blocks/ModuleRunner';
import { WorksheetRunner } from '@/components/blocks/WorksheetRunner';

export const metadata: Metadata = {
  title: 'Modul',
};

// Worksheet-Variante: alle Blöcke auf einer Seite, Auto-Save + definitive Abgabe.
function renderWorksheet(id: string, moduleData: StudentModule, progress: ModuleProgress | null) {
  async function saveDraft(answers: Record<string, BlockAnswer>) {
    'use server';
    await saveWorksheetDraft({ moduleId: id, answers });
  }
  async function submit(answers: Record<string, BlockAnswer>) {
    'use server';
    await submitWorksheet({ moduleId: id, answers });
  }
  return (
    <WorksheetRunner
      blocks={moduleData.content.blocks}
      initialAnswers={progress?.answers ?? {}}
      initialSubmittedAt={progress?.completedAt ?? null}
      onSaveDraft={saveDraft}
      onSubmit={submit}
    />
  );
}

// Quiz-Variante (Default): Block-für-Block-Runner mit Sofort-Feedback.
function renderQuiz(id: string, moduleData: StudentModule, progress: ModuleProgress | null) {
  const startIndex = Math.min(
    progress?.currentBlockIndex ?? 0,
    moduleData.content.blocks.length - 1
  );
  async function save(args: {
    blockIndex: number;
    answers: Record<string, BlockAnswer>;
    score: number;
    done: boolean;
  }) {
    'use server';
    await saveProgress({ moduleId: id, ...args });
  }
  return (
    <ModuleRunner
      moduleId={id}
      blocks={moduleData.content.blocks}
      startIndex={startIndex}
      initialAnswers={progress?.answers ?? {}}
      onSave={save}
    />
  );
}

// Wrong-Only-Variante (R1.4): Schüler:in wiederholt nur die falsch
// beantworteten Fragen aus dem letzten Durchlauf. KEIN DB-Write am Ende
// (no-op onSave) — der zuvor gespeicherte Score in student_progress bleibt
// stehen. Theorie-Blöcke werden mitgeführt, damit der Lern-Kontext nicht
// fehlt. Wenn keine falsch beantworteten Blocks existieren: Redirect zurück
// zur Endseite (nichts zu wiederholen).
function renderWrongOnly(id: string, moduleData: StudentModule, progress: ModuleProgress | null) {
  const allBlocks = moduleData.content.blocks;
  const previousAnswers: Record<string, BlockAnswer> = progress?.answers ?? {};
  const wrongIds = new Set(
    allBlocks
      .filter((b) => isGraded(b) && blockResult(b, previousAnswers[b.id]) === 'wrong')
      .map((b) => b.id)
  );
  if (wrongIds.size === 0) {
    redirect(`/s/modul/${id}/done`);
  }
  // Theorie-Blöcke + falsch beantwortete graded Blocks in Original-
  // Reihenfolge. Korrekt beantwortete graded Blocks werden übersprungen.
  const filtered = allBlocks.filter((b) => !isGraded(b) || wrongIds.has(b.id));
  async function noopSave() {
    'use server';
    // Bewusst kein DB-Write: Wrong-Only ist reiner Übungs-Modus.
  }
  return (
    <ModuleRunner
      moduleId={id}
      blocks={filtered}
      startIndex={0}
      initialAnswers={{}}
      onSave={noopSave}
    />
  );
}

// Phase G5: Abschlusstest-Schutz. Wenn das Modul ein Abschlusstest ist,
// muss vor dem Render geprüft werden ob die Schüler:in alle Lernmodule des
// Themas erledigt hat. Sonst Redirect zur Themen-Detailseite — dort sieht
// sie welche Module noch offen sind. URL-Rate-Schutz: niemand kann sich
// am Abschlusstest vorbeischmuggeln.
async function guardAbschlusstest(
  moduleData: StudentModule,
  classId: string,
  studentCodeId: string
): Promise<void> {
  if (moduleData.activityKind !== 'abschlusstest') return;
  if (!moduleData.topicId) {
    // Abschlusstest ohne Thema: ungewöhnlich, Sperre standardmäßig
    notFound();
  }
  const topics = await getAssignedTopicsForStudent(classId, studentCodeId);
  const topic = topics.find((t) => t.topicId === moduleData.topicId);
  if (!topic) {
    notFound();
  }
  const unlock = getAbschlusstestUnlock(
    topic.modules.map((m) => ({
      title: m.title,
      status: m.status,
      activityKind: m.activityKind,
    }))
  );
  if (!unlock.allowed) {
    redirect(`/s/thema/${topic.slug}`);
  }
}

export default async function ModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireStudentSession();
  const { id } = await params;
  const sp = await searchParams;
  const moduleData = await getStudentModule(id, session.classId);
  if (!moduleData) {
    notFound();
  }
  await guardAbschlusstest(moduleData, session.classId, session.studentCodeId);
  const progress = await getProgress(session.studentCodeId, id);

  // R1.4: Wrong-Only-Modus (?wrongOnly=1) — nur falsch beantwortete Fragen
  // wiederholen, kein DB-Write. Vorrang vor displayMode/Worksheet, weil
  // Worksheet einen anderen Submit-Zyklus hat.
  if (sp.wrongOnly === '1') {
    return renderWrongOnly(id, moduleData, progress);
  }

  return moduleData.displayMode === 'worksheet'
    ? renderWorksheet(id, moduleData, progress)
    : renderQuiz(id, moduleData, progress);
}
