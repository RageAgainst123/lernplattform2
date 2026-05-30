'use server';

import { createServiceClient } from '@/lib/supabase/admin';
import { getStudentSession } from '@/lib/auth/student-auth';
import { moduleContentSchema } from '@/lib/schemas/blocks';
import { maxScore, scoreModule, type BlockAnswer } from '@/lib/blocks/evaluate';

type SaveArgs = {
  moduleId: string;
  blockIndex: number;
  answers: Record<string, BlockAnswer>;
  score: number;
  done: boolean;
};

// Lädt den Modul-Inhalt und berechnet Score + Maximalpunktzahl serverseitig
// aus den gegebenen Antworten. Single Source of Truth für die Bewertung —
// der Client wird nicht für den Score vertraut. null-max bei kaputtem Modul.
async function computeScore(
  supabase: ReturnType<typeof createServiceClient>,
  moduleId: string,
  answers: Record<string, BlockAnswer>
): Promise<{ score: number; max: number | null }> {
  const { data: moduleRow } = await supabase
    .from('modules')
    .select('content')
    .eq('id', moduleId)
    .maybeSingle();
  const parsed = moduleRow ? moduleContentSchema.safeParse(moduleRow.content) : null;
  if (!parsed?.success) {
    return { score: 0, max: null };
  }
  return { score: scoreModule(parsed.data.blocks, answers), max: maxScore(parsed.data.blocks) };
}

// Speichert den Lern-Fortschritt. studentCodeId kommt aus der Session (nicht aus
// Client-Input) — Schüler:innen können nur ihren eigenen Fortschritt schreiben.
export async function saveProgress(args: SaveArgs): Promise<void> {
  const session = await getStudentSession();
  if (!session) {
    return;
  }

  const supabase = createServiceClient();
  const { max } = await computeScore(supabase, args.moduleId, args.answers);

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

// Prüft, ob die Schüler:innen-Session zum gegebenen Modul bereits abgegeben
// hat. Wird von beiden Worksheet-Actions benutzt für Idempotenz + Schutz.
async function isAlreadySubmitted(
  supabase: ReturnType<typeof createServiceClient>,
  studentCodeId: string,
  moduleId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('student_progress')
    .select('completed_at')
    .eq('student_code_id', studentCodeId)
    .eq('module_id', moduleId)
    .maybeSingle();
  return !!data?.completed_at;
}

// Worksheet-Variante: Auto-Save (Entwurf). Nur Antworten + Aktivitäts-
// Zeitstempel ändern, completed_at unverändert lassen. Wenn der Eintrag
// bereits abgegeben ist, ignorieren — Schutz gegen nachträgliche Manipulation.
export async function saveWorksheetDraft(args: {
  moduleId: string;
  answers: Record<string, BlockAnswer>;
}): Promise<void> {
  const session = await getStudentSession();
  if (!session) return;
  const supabase = createServiceClient();
  if (await isAlreadySubmitted(supabase, session.studentCodeId, args.moduleId)) return;
  await supabase.from('student_progress').upsert(
    {
      student_code_id: session.studentCodeId,
      module_id: args.moduleId,
      current_block_index: 0,
      answers: args.answers,
      score: 0,
      max_score: null,
      last_activity_at: new Date().toISOString(),
    },
    { onConflict: 'student_code_id,module_id' }
  );
}

// Worksheet-Variante: definitive Abgabe. Berechnet Score + Maximalpunktzahl
// serverseitig, setzt completed_at und sperrt damit weitere Änderungen. Wenn
// bereits abgegeben, idempotent ignorieren.
//
// Korrektur-Zyklus: Eine evtl. vorausgegangene Rückgabe wird hier zurückgesetzt
// (returned_at, teacher_feedback, manual_marks) — sonst hinge der returned-Status
// + altes Feedback neben der frischen Abgabe.
export async function submitWorksheet(args: {
  moduleId: string;
  answers: Record<string, BlockAnswer>;
}): Promise<void> {
  const session = await getStudentSession();
  if (!session) return;
  const supabase = createServiceClient();
  if (await isAlreadySubmitted(supabase, session.studentCodeId, args.moduleId)) return;
  const { score, max } = await computeScore(supabase, args.moduleId, args.answers);
  const now = new Date().toISOString();
  await supabase.from('student_progress').upsert(
    {
      student_code_id: session.studentCodeId,
      module_id: args.moduleId,
      current_block_index: 0,
      answers: args.answers,
      score,
      max_score: max,
      completed_at: now,
      last_activity_at: now,
      returned_at: null,
      teacher_feedback: null,
      manual_marks: {},
    },
    { onConflict: 'student_code_id,module_id' }
  );
}
