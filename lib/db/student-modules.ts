import 'server-only';
import { createServiceClient } from '@/lib/supabase/admin';
import { moduleContentSchema, type ModuleContent } from '@/lib/schemas/blocks';
import type { BlockAnswer } from '@/lib/blocks/evaluate';
import type { ActivityKind, DisplayMode } from '@/lib/schemas/entities';
import { progressStatusMap, type ModuleStatus, type ProgressRow } from './student-modules-status';

// Re-export der reinen Status-Helper, damit Aufrufer wie Komponenten nur eine
// Datei importieren müssen.
export { progressStatusMap, type ModuleStatus };

export type StudentModule = {
  id: string;
  title: string;
  content: ModuleContent;
  displayMode: DisplayMode;
  activityKind: ActivityKind;
  topicId: string | null;
};

export type ModuleProgress = {
  currentBlockIndex: number;
  answers: Record<string, BlockAnswer>;
  completedAt: string | null;
  returnedAt: string | null;
  teacherFeedback: string | null;
};

// Prüft, ob ein Modul der Klasse der Schüler:in zugewiesen ist (class_modules).
// Exportiert (Pre-Launch-Audit HIGH-6, 2026-06-04) damit progress-action.ts
// vor jedem upsert prüfen kann, ob der vom Client geschickte moduleId
// überhaupt zur eigenen Klasse gehört — sonst IDOR-Risiko (Schüler:in könnte
// preemptiv Score für später zugewiesene Module schreiben).
export async function isAssigned(moduleId: string, classId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('class_modules')
    .select('id')
    .eq('module_id', moduleId)
    .eq('class_id', classId)
    .maybeSingle();
  return !!data;
}

// Lädt ein der Klasse zugewiesenes, veröffentlichtes Modul. Null, wenn nicht
// zugewiesen (Zugriffsschutz für Schüler:innen).
//
// Phase E: Präsentationen werden NICHT geliefert — sie sind für den Beamer
// gedacht. Phase G5: Lernmodul + Quiz + Abschlusstest sind alle für die
// Schüler:in zugänglich (Abschlusstest mit zusätzlichem Voraussetzungs-
// Check in der Page-Schicht, nicht hier — sonst kommt der page-Schutz nicht
// mehr zum Zug). Präsentationen weiterhin null → notFound().
const STUDENT_MODULE_KINDS: ActivityKind[] = ['lernmodul', 'quiz', 'abschlusstest'];

export async function getStudentModule(
  moduleId: string,
  classId: string
): Promise<StudentModule | null> {
  if (!(await isAssigned(moduleId, classId))) {
    return null;
  }
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('modules')
    .select('id, title, content, is_published, activity_kind, display_mode, topic_id')
    .eq('id', moduleId)
    .in('activity_kind', STUDENT_MODULE_KINDS)
    .maybeSingle();
  if (!data || !data.is_published) {
    return null;
  }
  const parsed = moduleContentSchema.safeParse(data.content);
  return {
    id: data.id,
    title: data.title,
    content: parsed.success ? parsed.data : { blocks: [] },
    displayMode: (data.display_mode as DisplayMode | null) ?? 'quiz',
    activityKind: data.activity_kind as ActivityKind,
    topicId: (data.topic_id as string | null) ?? null,
  };
}

export type AssignedModule = {
  id: string;
  title: string;
  description: string | null;
  status: ModuleStatus;
};

type ModuleRef = {
  id: string;
  title: string;
  description: string | null;
  is_published: boolean;
  activity_kind: string;
};

// Lädt die der Klasse zugewiesenen, veröffentlichten LERNMODULE + 3-Stufen-Status
// der Schüler:in (fürs Dashboard). Phase E: Präsentationen filtern wir hier raus —
// sie sind für den Beamer gedacht und erscheinen für Schüler:innen nur als
// LiveOverlay während einer laufenden live_session, nicht als eigene Modul-Karte.
export async function getAssignedModules(
  classId: string,
  studentCodeId: string
): Promise<AssignedModule[]> {
  const supabase = createServiceClient();
  const { data: assignments } = await supabase
    .from('class_modules')
    .select('modules(id, title, description, is_published, activity_kind)')
    .eq('class_id', classId);
  if (!assignments) {
    return [];
  }

  const { data: progressRows } = await supabase
    .from('student_progress')
    .select('module_id, completed_at, returned_at')
    .eq('student_code_id', studentCodeId);
  const statusByModule = progressStatusMap((progressRows ?? []) as ProgressRow[]);

  return assignments
    .map((a) => a.modules as unknown as ModuleRef)
    .filter((m) => m && m.is_published && m.activity_kind === 'lernmodul')
    .map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      status: statusByModule.get(m.id) ?? 'open',
    }));
}

// Lädt den gespeicherten Fortschritt einer Schüler:in für ein Modul.
export async function getProgress(
  studentCodeId: string,
  moduleId: string
): Promise<ModuleProgress | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('student_progress')
    .select('current_block_index, answers, completed_at, returned_at, teacher_feedback')
    .eq('student_code_id', studentCodeId)
    .eq('module_id', moduleId)
    .maybeSingle();
  if (!data) {
    return null;
  }
  return {
    currentBlockIndex: data.current_block_index ?? 0,
    answers: (data.answers as Record<string, BlockAnswer>) ?? {},
    completedAt: data.completed_at,
    returnedAt: data.returned_at,
    teacherFeedback: data.teacher_feedback,
  };
}
