import 'server-only';
import { createServiceClient } from '@/lib/supabase/admin';
import { moduleContentSchema, type ModuleContent } from '@/lib/schemas/blocks';
import type { BlockAnswer } from '@/lib/blocks/evaluate';

export type StudentModule = {
  id: string;
  title: string;
  content: ModuleContent;
};

export type ModuleProgress = {
  currentBlockIndex: number;
  answers: Record<string, BlockAnswer>;
  completedAt: string | null;
};

// Prüft, ob ein Modul der Klasse der Schüler:in zugewiesen ist (class_modules).
async function isAssigned(moduleId: string, classId: string): Promise<boolean> {
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
    .select('id, title, content, is_published')
    .eq('id', moduleId)
    .maybeSingle();
  if (!data || !data.is_published) {
    return null;
  }
  const parsed = moduleContentSchema.safeParse(data.content);
  return { id: data.id, title: data.title, content: parsed.success ? parsed.data : { blocks: [] } };
}

export type AssignedModule = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
};

type ModuleRef = { id: string; title: string; description: string | null; is_published: boolean };

// Lädt die der Klasse zugewiesenen, veröffentlichten Module + Abschluss-Status
// der Schüler:in (fürs Dashboard).
export async function getAssignedModules(
  classId: string,
  studentCodeId: string
): Promise<AssignedModule[]> {
  const supabase = createServiceClient();
  const { data: assignments } = await supabase
    .from('class_modules')
    .select('modules(id, title, description, is_published)')
    .eq('class_id', classId);
  if (!assignments) {
    return [];
  }

  const { data: progressRows } = await supabase
    .from('student_progress')
    .select('module_id, completed_at')
    .eq('student_code_id', studentCodeId);
  const completedIds = new Set(
    (progressRows ?? []).filter((p) => p.completed_at).map((p) => p.module_id)
  );

  return assignments
    .map((a) => a.modules as unknown as ModuleRef)
    .filter((m) => m && m.is_published)
    .map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      completed: completedIds.has(m.id),
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
    .select('current_block_index, answers, completed_at')
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
  };
}
