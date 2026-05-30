import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { moduleContentSchema, type ModuleContent } from '@/lib/schemas/blocks';
import type { BlockAnswer } from '@/lib/blocks/evaluate';

// Lädt EINE Schüler:innen-Abgabe (Schüler:in × Modul) für die Lehrer:innen-
// Detailansicht. Ausschließlich User-Client → RLS-Policies erzwingen, dass nur
// Abgaben aus eigenen Klassen sichtbar sind:
//   - student_codes_all_own              (Codename nur eigener Klassen)
//   - modules_select_published_or_own    (Modul-Inhalt)
//   - student_progress_select_own_classes(Antworten + Score + Feedback)
// NIEMALS Service-Role hier — das wäre ein RLS-Bypass.

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type TeacherSubmission = {
  moduleId: string;
  moduleTitle: string;
  studentCodeId: string;
  codename: string;
  content: ModuleContent;
  answers: Record<string, BlockAnswer>;
  score: number;
  maxScore: number | null;
  completedAt: string | null;
  returnedAt: string | null;
  teacherFeedback: string | null;
  passThreshold: number | null;
  manualMarks: Record<string, boolean>;
  // false = Schüler:in hat das Modul noch nicht begonnen (keine Progress-Row).
  hasProgress: boolean;
};

type ProgressRow = {
  answers: unknown;
  score: number;
  max_score: number | null;
  completed_at: string | null;
  returned_at: string | null;
  teacher_feedback: string | null;
  manual_marks: unknown;
};

// Schüler:in der Klasse (Doppelfilter id + class_id; RLS sichert eigene Klasse).
async function loadStudent(supabase: Supabase, classId: string, studentCodeId: string) {
  const { data } = await supabase
    .from('student_codes')
    .select('id, codename')
    .eq('id', studentCodeId)
    .eq('class_id', classId)
    .maybeSingle();
  return data;
}

// Modul-Inhalt (geparst). null wenn Modul nicht sichtbar.
async function loadModuleContent(supabase: Supabase, moduleId: string) {
  const { data } = await supabase
    .from('modules')
    .select('id, title, content')
    .eq('id', moduleId)
    .maybeSingle();
  if (!data) return null;
  const parsed = moduleContentSchema.safeParse(data.content);
  return { title: data.title as string, content: parsed.success ? parsed.data : { blocks: [] } };
}

async function loadThreshold(
  supabase: Supabase,
  classId: string,
  moduleId: string
): Promise<number | null> {
  const { data } = await supabase
    .from('class_modules')
    .select('pass_threshold')
    .eq('class_id', classId)
    .eq('module_id', moduleId)
    .maybeSingle();
  return (data?.pass_threshold as number | null) ?? null;
}

async function loadProgress(
  supabase: Supabase,
  studentCodeId: string,
  moduleId: string
): Promise<ProgressRow | null> {
  const { data } = await supabase
    .from('student_progress')
    .select('answers, score, max_score, completed_at, returned_at, teacher_feedback, manual_marks')
    .eq('student_code_id', studentCodeId)
    .eq('module_id', moduleId)
    .maybeSingle();
  return (data as ProgressRow | null) ?? null;
}

type StudentRef = { id: string; codename: string };
type ModuleRef = { title: string; content: ModuleContent };

// Die fortschritts-bezogenen Felder von TeacherSubmission.
type ProgressPart = Pick<
  TeacherSubmission,
  | 'answers'
  | 'score'
  | 'maxScore'
  | 'completedAt'
  | 'returnedAt'
  | 'teacherFeedback'
  | 'manualMarks'
  | 'hasProgress'
>;

const EMPTY_PROGRESS: ProgressPart = {
  answers: {},
  score: 0,
  maxScore: null,
  completedAt: null,
  returnedAt: null,
  teacherFeedback: null,
  manualMarks: {},
  hasProgress: false,
};

// Mappt eine vorhandene Progress-Row (non-null → keine ?.-Ketten). Fehlende Row =
// EMPTY_PROGRESS (noch nicht begonnen).
function toProgressPart(row: ProgressRow | null): ProgressPart {
  if (!row) return EMPTY_PROGRESS;
  return {
    answers: (row.answers as Record<string, BlockAnswer>) ?? {},
    score: row.score,
    maxScore: row.max_score,
    completedAt: row.completed_at,
    returnedAt: row.returned_at,
    teacherFeedback: row.teacher_feedback,
    manualMarks: (row.manual_marks as Record<string, boolean>) ?? {},
    hasProgress: true,
  };
}

// Reine Zusammenführung der vier Query-Ergebnisse → TeacherSubmission.
function toSubmission(args: {
  moduleId: string;
  student: StudentRef;
  mod: ModuleRef;
  passThreshold: number | null;
  row: ProgressRow | null;
}): TeacherSubmission {
  const { moduleId, student, mod, passThreshold, row } = args;
  return {
    moduleId,
    moduleTitle: mod.title,
    studentCodeId: student.id,
    codename: student.codename,
    content: mod.content,
    passThreshold,
    ...toProgressPart(row),
  };
}

export async function getTeacherSubmission(
  classId: string,
  studentCodeId: string,
  moduleId: string
): Promise<TeacherSubmission | null> {
  const supabase = await createClient();

  const student = await loadStudent(supabase, classId, studentCodeId);
  if (!student) return null;

  const mod = await loadModuleContent(supabase, moduleId);
  if (!mod) return null;

  const [passThreshold, row] = await Promise.all([
    loadThreshold(supabase, classId, moduleId),
    loadProgress(supabase, studentCodeId, moduleId),
  ]);

  return toSubmission({ moduleId, student, mod, passThreshold, row });
}
