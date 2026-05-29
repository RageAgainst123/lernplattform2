import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireStudentSession } from '@/lib/auth/student-auth';
import {
  getProgress,
  getStudentModule,
  type StudentModule,
  type ModuleProgress,
} from '@/lib/db/student-modules';
import { saveProgress, saveWorksheetDraft, submitWorksheet } from '@/lib/db/progress-action';
import type { BlockAnswer } from '@/lib/blocks/evaluate';
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

export default async function ModulePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireStudentSession();
  const { id } = await params;
  const moduleData = await getStudentModule(id, session.classId);
  if (!moduleData) {
    notFound();
  }
  const progress = await getProgress(session.studentCodeId, id);
  return moduleData.displayMode === 'worksheet'
    ? renderWorksheet(id, moduleData, progress)
    : renderQuiz(id, moduleData, progress);
}
