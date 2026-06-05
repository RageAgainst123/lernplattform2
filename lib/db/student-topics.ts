import 'server-only';
import { createServiceClient } from '@/lib/supabase/admin';
import { progressInfoMap, type ProgressInfo, type ProgressRow } from './student-modules-status';
import {
  addStubIfNew,
  buildStudentTopic,
  sortStudentTopics,
  stubFromClassModuleRow,
  stubFromModuleRow,
  type ClassModuleJoinRow,
  type StudentModuleRow,
  type StudentTopic,
  type StudentTopicModuleStub,
  type StudentTopicRow,
} from './student-topics-internals';

// Schüler:innen-Themen-Sicht.
//
// Phase V (2026-06): class_topics ist jetzt Source of Truth. Module
// ergeben sich aus modules.topic_id (alle published Module aller
// zugewiesenen Topics). class_modules wird als Backward-Compat-Quelle
// dazugemixt — für Legacy-Zuweisungen aus pre-V und für Orphan-Module
// (einzelne Module ohne Topic, direkt zugewiesen).
//
// Präsentationen werden komplett rausgefiltert — sie sind Lehrer:in-only.

export type { StudentTopic, StudentTopicModule } from './student-topics-internals';

type SupabaseSvc = ReturnType<typeof createServiceClient>;

// Quelle A (Phase V — class_topics): alle published Module zugewiesener Topics.
async function loadPhaseVStubs(
  svc: SupabaseSvc,
  classId: string,
  modulesByTopic: Map<string, StudentTopicModuleStub[]>,
  seenModuleIds: Set<string>
): Promise<void> {
  const { data: ctData, error: ctErr } = await svc
    .from('class_topics')
    .select('topic_id')
    .eq('class_id', classId);
  if (ctErr) {
    throw new Error(`Zugewiesene Themen konnten nicht geladen werden: ${ctErr.message}`);
  }
  const topicIds = ((ctData ?? []) as { topic_id: string }[]).map((r) => r.topic_id);
  if (topicIds.length === 0) return;
  const { data: modData, error: modErr } = await svc
    .from('modules')
    .select('id, title, is_published, topic_id, activity_kind, sort_order')
    .in('topic_id', topicIds)
    .eq('is_published', true);
  if (modErr) {
    throw new Error(`Modul-Liste konnte nicht geladen werden: ${modErr.message}`);
  }
  for (const m of (modData ?? []) as StudentModuleRow[]) {
    const stub = stubFromModuleRow(m);
    if (stub) addStubIfNew(modulesByTopic, seenModuleIds, stub);
  }
}

// Quelle B (Legacy — class_modules): Bestands-Zuweisungen aus pre-V.
async function loadLegacyStubs(
  svc: SupabaseSvc,
  classId: string,
  modulesByTopic: Map<string, StudentTopicModuleStub[]>,
  seenModuleIds: Set<string>
): Promise<void> {
  const { data, error } = await svc
    .from('class_modules')
    .select('module_id, modules(title, is_published, topic_id, activity_kind, sort_order)')
    .eq('class_id', classId);
  if (error) {
    throw new Error(`Zugewiesene Module konnten nicht geladen werden: ${error.message}`);
  }
  for (const r of (data ?? []) as unknown as ClassModuleJoinRow[]) {
    const stub = stubFromClassModuleRow(r);
    if (stub) addStubIfNew(modulesByTopic, seenModuleIds, stub);
  }
}

// Schritt 1: Stubs aus beiden Quellen sammeln.
async function loadStubsForStudent(
  classId: string
): Promise<Map<string, StudentTopicModuleStub[]>> {
  const svc = createServiceClient();
  const modulesByTopic = new Map<string, StudentTopicModuleStub[]>();
  const seenModuleIds = new Set<string>();
  await loadPhaseVStubs(svc, classId, modulesByTopic, seenModuleIds);
  await loadLegacyStubs(svc, classId, modulesByTopic, seenModuleIds);
  return modulesByTopic;
}

// Schritt 2: Status- + Score-Map für die Schüler:in laden.
async function loadProgressInfoMap(studentCodeId: string): Promise<Map<string, ProgressInfo>> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('student_progress')
    .select('module_id, completed_at, returned_at, score, max_score')
    .eq('student_code_id', studentCodeId);
  if (error) {
    throw new Error(`Fortschritt konnte nicht geladen werden: ${error.message}`);
  }
  return progressInfoMap((data ?? []) as ProgressRow[]);
}

// Schritt 3: Topic-Metadaten zu den betroffenen IDs laden.
async function loadTopicRows(topicIds: string[]): Promise<StudentTopicRow[]> {
  if (topicIds.length === 0) return [];
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('topics')
    .select('id, slug, label, description, schulstufe, kompetenzbereich, sort_order')
    .in('id', topicIds);
  if (error) {
    throw new Error(`Themen-Metadaten konnten nicht geladen werden: ${error.message}`);
  }
  return (data ?? []) as StudentTopicRow[];
}

// Hauptfunktion: Themen-Karten für das Schüler-Dashboard.
export async function getAssignedTopicsForStudent(
  classId: string,
  studentCodeId: string
): Promise<StudentTopic[]> {
  const moduleIdsByTopic = await loadStubsForStudent(classId);
  const topicIds = Array.from(moduleIdsByTopic.keys());
  if (topicIds.length === 0) return [];
  const [progressByModule, topicRows] = await Promise.all([
    loadProgressInfoMap(studentCodeId),
    loadTopicRows(topicIds),
  ]);
  return sortStudentTopics(
    topicRows.map((t) => buildStudentTopic(t, moduleIdsByTopic.get(t.id) ?? [], progressByModule))
  );
}

// Ein einzelnes Thema per Slug (für die Themen-Detailseite).
export async function getAssignedTopicBySlug(
  classId: string,
  studentCodeId: string,
  slug: string
): Promise<StudentTopic | null> {
  const all = await getAssignedTopicsForStudent(classId, studentCodeId);
  return all.find((t) => t.slug === slug) ?? null;
}
