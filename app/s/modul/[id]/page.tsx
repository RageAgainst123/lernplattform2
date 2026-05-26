import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireStudentSession } from '@/lib/auth/student-auth';
import { getProgress, getStudentModule } from '@/lib/db/student-modules';
import { saveProgress } from '@/lib/db/progress-action';
import type { BlockAnswer } from '@/lib/blocks/evaluate';
import { ModuleRunner } from '@/components/blocks/ModuleRunner';

export const metadata: Metadata = {
  title: 'Modul',
};

export default async function ModulePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireStudentSession();
  const { id } = await params;

  const moduleData = await getStudentModule(id, session.classId);
  if (!moduleData) {
    notFound();
  }

  const progress = await getProgress(session.studentCodeId, id);
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
