'use server';

import { createServiceClient } from '@/lib/supabase/admin';
import { getStudentSession } from '@/lib/auth/student-auth';
import { moduleContentSchema } from '@/lib/schemas/blocks';
import { maxScore, type BlockAnswer } from '@/lib/blocks/evaluate';

type SaveArgs = {
  moduleId: string;
  blockIndex: number;
  answers: Record<string, BlockAnswer>;
  score: number;
  done: boolean;
};

// Speichert den Lern-Fortschritt. studentCodeId kommt aus der Session (nicht aus
// Client-Input) — Schüler:innen können nur ihren eigenen Fortschritt schreiben.
export async function saveProgress(args: SaveArgs): Promise<void> {
  const session = await getStudentSession();
  if (!session) {
    return;
  }

  const supabase = createServiceClient();
  const { data: moduleRow } = await supabase
    .from('modules')
    .select('content')
    .eq('id', args.moduleId)
    .maybeSingle();
  const parsed = moduleRow ? moduleContentSchema.safeParse(moduleRow.content) : null;
  const max = parsed?.success ? maxScore(parsed.data.blocks) : null;

  await supabase.from('student_progress').upsert(
    {
      student_code_id: session.studentCodeId,
      module_id: args.moduleId,
      current_block_index: args.blockIndex,
      answers: args.answers,
      score: args.score,
      max_score: max,
      completed_at: args.done ? new Date().toISOString() : null,
      last_activity_at: new Date().toISOString(),
    },
    { onConflict: 'student_code_id,module_id' }
  );
}
