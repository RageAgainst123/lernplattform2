import { createClient } from '@/lib/supabase/server';
import { getAssignedModulesForClass, type AssignedModuleForTeacher } from '@/lib/db/class-modules';
import type { ModuleStatus } from '@/lib/db/student-modules-status';

// Lädt die komplette Fortschritts-Matrix einer Klasse: alle Schüler:innen
// × alle zugewiesenen Module + Status pro Schnittpunkt. RLS-Policy
// `student_progress_select_own_classes` sorgt dafür, dass nur Progress-Rows
// für Klassen der eingeloggten Lehrer:in sichtbar sind.
//
// Drei DB-Queries (alle parallel ausführbar): student_codes der Klasse,
// zugewiesene Module, student_progress-Rows für genau diese Schüler:innen.

export type ProgressCell = {
  studentCodeId: string;
  moduleId: string;
  status: ModuleStatus;
  score: number | null;
  maxScore: number | null;
  lastActivityAt: string | null;
  completedAt: string | null;
};

export type StudentRef = {
  id: string;
  codename: string;
};

export type ClassProgressMatrix = {
  students: StudentRef[];
  modules: AssignedModuleForTeacher[];
  // Lookup-Map (`${studentId}::${moduleId}` → ProgressCell). Spart in der UI
  // die O(n) Suche und macht das Rendering trivial.
  cellMap: Map<string, ProgressCell>;
};

export function cellKey(studentCodeId: string, moduleId: string): string {
  return `${studentCodeId}::${moduleId}`;
}

type StudentCodeRow = { id: string; codename: string };

type ProgressRow = {
  student_code_id: string;
  module_id: string;
  completed_at: string | null;
  last_activity_at: string;
  score: number;
  max_score: number | null;
};

export async function getClassProgress(classId: string): Promise<ClassProgressMatrix> {
  const supabase = await createClient();

  const [studentsResult, modules] = await Promise.all([
    supabase
      .from('student_codes')
      .select('id, codename')
      .eq('class_id', classId)
      .order('codename', { ascending: true }),
    getAssignedModulesForClass(classId),
  ]);

  if (studentsResult.error) {
    throw new Error(`Schüler:innen konnten nicht geladen werden: ${studentsResult.error.message}`);
  }
  const students = (studentsResult.data ?? []) as StudentCodeRow[];

  // Nur Progress-Rows der relevanten Schüler:innen UND der relevanten Module
  // laden — spart Datenmenge bei Klassen die Zugriff auf viele Codes haben
  // könnten. RLS würde es sonst auch limitieren, aber Filter ist klarer.
  const studentIds = students.map((s) => s.id);
  const moduleIds = modules.map((m) => m.moduleId);

  let progressRows: ProgressRow[] = [];
  if (studentIds.length > 0 && moduleIds.length > 0) {
    const { data, error } = await supabase
      .from('student_progress')
      .select('student_code_id, module_id, completed_at, last_activity_at, score, max_score')
      .in('student_code_id', studentIds)
      .in('module_id', moduleIds);
    if (error) {
      throw new Error(`Fortschritt konnte nicht geladen werden: ${error.message}`);
    }
    progressRows = (data ?? []) as ProgressRow[];
  }

  const cellMap = new Map<string, ProgressCell>();
  for (const row of progressRows) {
    const status: ModuleStatus = row.completed_at ? 'done' : 'in_progress';
    cellMap.set(cellKey(row.student_code_id, row.module_id), {
      studentCodeId: row.student_code_id,
      moduleId: row.module_id,
      status,
      score: row.score,
      maxScore: row.max_score,
      lastActivityAt: row.last_activity_at,
      completedAt: row.completed_at,
    });
  }

  return { students: students.map((s) => ({ id: s.id, codename: s.codename })), modules, cellMap };
}

// Pure Helper: für eine bestimmte (Schüler:in, Modul)-Kombination die Zelle
// zurückgeben — Default `'open'` wenn keine Progress-Row vorhanden ist.
export function getCellOrOpen(
  matrix: ClassProgressMatrix,
  studentCodeId: string,
  moduleId: string
): ProgressCell {
  const existing = matrix.cellMap.get(cellKey(studentCodeId, moduleId));
  if (existing) return existing;
  return {
    studentCodeId,
    moduleId,
    status: 'open',
    score: null,
    maxScore: null,
    lastActivityAt: null,
    completedAt: null,
  };
}

// Pure Helper: Counts pro Status über die gesamte Matrix — für die
// Übersichts-Pille oben.
export function countMatrixStatuses(matrix: ClassProgressMatrix): Record<ModuleStatus, number> {
  const counts: Record<ModuleStatus, number> = { open: 0, in_progress: 0, done: 0 };
  for (const student of matrix.students) {
    for (const mod of matrix.modules) {
      const cell = getCellOrOpen(matrix, student.id, mod.moduleId);
      counts[cell.status] += 1;
    }
  }
  return counts;
}
