import { createClient } from '@/lib/supabase/server';
import type { ActivityKind, DisplayMode } from '@/lib/schemas/entities';

// Lese-Queries für class_modules (Modul-Zuweisungen einer Klasse).
// RLS-Policy `class_modules_all_own` erzwingt, dass nur Klassen des aktuell
// eingeloggten Lehrer:innen-Profils sichtbar sind (auth.uid() = teacher_id).
// Kein zusätzlicher Filter im Code nötig.

export type AssignedModuleForTeacher = {
  moduleId: string;
  title: string;
  description: string | null;
  schulstufe: number | null;
  topic: string | null;
  activityKind: ActivityKind;
  displayMode: DisplayMode;
  dueDate: string | null;
  assignedAt: string;
  // Bestehens-Schwelle in Prozent (0–100) für DIESE Zuweisung. null = keine.
  passThreshold: number | null;
};

type AssignmentRow = {
  module_id: string;
  due_date: string | null;
  assigned_at: string;
  pass_threshold: number | null;
  modules: {
    title: string;
    description: string | null;
    schulstufe: number | null;
    topic: string | null;
    activity_kind: ActivityKind;
    display_mode: DisplayMode | null;
  } | null;
};

// Lädt alle der Klasse zugewiesenen Module mit den wichtigsten Modul-Metadaten
// (für die Anzeige im Lehrer:innen-Panel). Sortiert nach Modul-Titel.
export async function getAssignedModulesForClass(
  classId: string
): Promise<AssignedModuleForTeacher[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('class_modules')
    .select(
      'module_id, due_date, assigned_at, pass_threshold, modules(title, description, schulstufe, topic, activity_kind, display_mode)'
    )
    .eq('class_id', classId);
  if (error) {
    throw new Error(`Zugewiesene Module konnten nicht geladen werden: ${error.message}`);
  }
  const rows = (data ?? []) as unknown as AssignmentRow[];
  return rows
    .filter((r) => r.modules !== null)
    .map((r) => ({
      moduleId: r.module_id,
      title: r.modules!.title,
      description: r.modules!.description,
      schulstufe: r.modules!.schulstufe,
      topic: r.modules!.topic,
      activityKind: r.modules!.activity_kind,
      displayMode: r.modules!.display_mode ?? 'quiz',
      dueDate: r.due_date,
      assignedAt: r.assigned_at,
      passThreshold: r.pass_threshold,
    }))
    .sort((a, b) => a.title.localeCompare(b.title, 'de'));
}
