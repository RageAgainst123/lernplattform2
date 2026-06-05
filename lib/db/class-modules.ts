import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import type { ActivityKind, DisplayMode } from '@/lib/schemas/entities';

// Lese-Queries für class_modules + class_topics → eine einheitliche Liste
// „zugewiesene Module dieser Klasse".
//
// Phase V (2026-06): Module können auf zwei Wegen zugewiesen sein:
//   1. direkt in class_modules (Bestand + Override-Pfad mit dueDate/passThreshold)
//   2. indirekt via class_topics → modules.topic_id (Phase-V-Source-of-Truth)
//
// Diese Funktion vereinigt beide Quellen und dedupliziert pro moduleId.
// Ohne (2) tauchen z.B. Showcase-Module nicht in der Fortschrittsmatrix auf,
// obwohl der Schüler:in das Modul gemacht hat.

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

type TopicModuleRow = {
  id: string;
  title: string;
  description: string | null;
  schulstufe: number | null;
  topic: string | null;
  activity_kind: ActivityKind;
  display_mode: DisplayMode | null;
};

function rowToAssigned(r: AssignmentRow): AssignedModuleForTeacher | null {
  if (!r.modules) return null;
  return {
    moduleId: r.module_id,
    title: r.modules.title,
    description: r.modules.description,
    schulstufe: r.modules.schulstufe,
    topic: r.modules.topic,
    activityKind: r.modules.activity_kind,
    displayMode: r.modules.display_mode ?? 'quiz',
    dueDate: r.due_date,
    assignedAt: r.assigned_at,
    passThreshold: r.pass_threshold,
  };
}

// Modul aus dem Topic-Pfad in einen AssignedModuleForTeacher-Eintrag
// verwandeln. Keine Override-Felder (dueDate=null, passThreshold=null);
// assignedAt nehmen wir aus class_topics.assigned_at.
function topicRowToAssigned(m: TopicModuleRow, assignedAt: string): AssignedModuleForTeacher {
  return {
    moduleId: m.id,
    title: m.title,
    description: m.description,
    schulstufe: m.schulstufe,
    topic: m.topic,
    activityKind: m.activity_kind,
    displayMode: m.display_mode ?? 'quiz',
    dueDate: null,
    assignedAt,
    passThreshold: null,
  };
}

// (1) direkter class_modules-Pfad — RLS-geschützt.
async function loadDirectAssignments(
  supabase: Awaited<ReturnType<typeof createClient>>,
  classId: string
): Promise<AssignedModuleForTeacher[]> {
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
  return rows.map(rowToAssigned).filter((m): m is AssignedModuleForTeacher => m !== null);
}

// (2) Phase-V-Topic-Pfad — class_topics → published Module per topic_id.
// Service-Role weil topics + modules öffentlich lesbar sind (RLS prüft eh
// nichts modul-spezifisches); class_topics-RLS hat bereits sichergestellt
// dass wir nur eigene Klassen sehen.
async function loadTopicAssignments(
  supabase: Awaited<ReturnType<typeof createClient>>,
  classId: string
): Promise<AssignedModuleForTeacher[]> {
  const { data: ctData, error: ctError } = await supabase
    .from('class_topics')
    .select('topic_id, assigned_at')
    .eq('class_id', classId);
  if (ctError) {
    throw new Error(`Themen-Zuweisungen konnten nicht geladen werden: ${ctError.message}`);
  }
  const topicAssignments = (ctData ?? []) as { topic_id: string; assigned_at: string }[];
  if (topicAssignments.length === 0) return [];

  const assignedAtByTopic = new Map(topicAssignments.map((t) => [t.topic_id, t.assigned_at]));
  const topicIds = Array.from(assignedAtByTopic.keys());

  const svc = createServiceClient();
  const { data: modData, error: modError } = await svc
    .from('modules')
    .select('id, title, description, schulstufe, topic, topic_id, activity_kind, display_mode')
    .in('topic_id', topicIds)
    .eq('is_published', true);
  if (modError) {
    throw new Error(`Modul-Liste konnte nicht geladen werden: ${modError.message}`);
  }
  const modRows = (modData ?? []) as (TopicModuleRow & { topic_id: string })[];
  return modRows.map((m) => topicRowToAssigned(m, assignedAtByTopic.get(m.topic_id) ?? ''));
}

// Lädt alle der Klasse zugewiesenen Module — vereinigt aus direkter
// class_modules-Zuweisung + class_topics-Pfad. Dedup pro moduleId,
// direkte Zuweisung gewinnt (sie trägt evtl. Override-Werte wie dueDate).
export async function getAssignedModulesForClass(
  classId: string
): Promise<AssignedModuleForTeacher[]> {
  const supabase = await createClient();
  const [direct, viaTopic] = await Promise.all([
    loadDirectAssignments(supabase, classId),
    loadTopicAssignments(supabase, classId),
  ]);

  // Dedup: direkter Eintrag gewinnt (er trägt evtl. Override-Werte).
  const byId = new Map<string, AssignedModuleForTeacher>();
  for (const m of direct) byId.set(m.moduleId, m);
  for (const m of viaTopic) if (!byId.has(m.moduleId)) byId.set(m.moduleId, m);

  return Array.from(byId.values()).sort((a, b) => a.title.localeCompare(b.title, 'de'));
}
