import 'server-only';
import { createServiceClient } from '@/lib/supabase/admin';
import type { ActivityKind, Kompetenzbereich } from '@/lib/schemas/entities';
import {
  progressInfoMap,
  type ModuleStatus,
  type ProgressInfo,
  type ProgressRow,
} from './student-modules-status';
import { aggregateTopicStatus, type TopicStatus } from './student-topics-status';

// Schüler:innen-Themen-Sicht (Phase G4). Pro Klasse + Schüler:in liefern
// wir Themen-Aggregat-Karten: Titel, Beschreibung, Fortschritt (done/total),
// Status (open/in_progress/done). Präsentationen werden komplett rausgefiltert
// — sie sind Lehrer:in-only (Stundeneinstieg am Beamer).

export type StudentTopicModule = {
  moduleId: string;
  title: string;
  activityKind: ActivityKind;
  sortOrder: number;
  status: ModuleStatus;
  // Erreichter Prozent-Score, nur bei status='done' / 'returned' relevant.
  // null wenn Modul keinen auto-bewertbaren Block hat oder noch nichts
  // gespeichert wurde. Wird im Lernpfad neben dem Status-Badge angezeigt.
  percent: number | null;
};

export type StudentTopic = {
  topicId: string;
  slug: string;
  label: string;
  description: string | null;
  schulstufe: number | null;
  kompetenzbereich: Kompetenzbereich | null;
  sortOrder: number;
  status: TopicStatus;
  total: number;
  done: number;
  inProgress: number;
  modules: StudentTopicModule[];
};

type AssignmentJoinRow = {
  module_id: string;
  modules: {
    title: string;
    is_published: boolean;
    topic_id: string | null;
    activity_kind: ActivityKind;
    sort_order: number;
  } | null;
};

type TopicRow = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  schulstufe: number | null;
  kompetenzbereich: Kompetenzbereich | null;
  sort_order: number;
};

// Module die für Schüler:innen relevant sind (alles außer Präsentation).
function isStudentRelevant(kind: ActivityKind): boolean {
  return kind !== 'praesentation';
}

// Schritt 1: Klassen-Zuweisungen laden + auf veröffentlichte + relevante
// Module + topic_id-Tabelle filtern.
async function loadAssignmentsForStudent(classId: string): Promise<{
  moduleIdsByTopic: Map<string, StudentTopicModuleStub[]>;
  allModuleIds: string[];
}> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('class_modules')
    .select('module_id, modules(title, is_published, topic_id, activity_kind, sort_order)')
    .eq('class_id', classId);
  if (error) {
    throw new Error(`Zugewiesene Module konnten nicht geladen werden: ${error.message}`);
  }
  const rows = (data ?? []) as unknown as AssignmentJoinRow[];
  const moduleIdsByTopic = new Map<string, StudentTopicModuleStub[]>();
  const allModuleIds: string[] = [];
  for (const r of rows) {
    if (!r.modules || !r.modules.is_published || !r.modules.topic_id) continue;
    if (!isStudentRelevant(r.modules.activity_kind)) continue;
    const stub: StudentTopicModuleStub = {
      moduleId: r.module_id,
      title: r.modules.title,
      activityKind: r.modules.activity_kind,
      sortOrder: r.modules.sort_order,
      topicId: r.modules.topic_id,
    };
    const list = moduleIdsByTopic.get(r.modules.topic_id) ?? [];
    list.push(stub);
    moduleIdsByTopic.set(r.modules.topic_id, list);
    allModuleIds.push(r.module_id);
  }
  return { moduleIdsByTopic, allModuleIds };
}

type StudentTopicModuleStub = {
  moduleId: string;
  title: string;
  activityKind: ActivityKind;
  sortOrder: number;
  topicId: string;
};

// Schritt 2: Status- + Score-Map für die Schüler:in laden (student_progress).
// Liefert pro Modul Status, score, maxScore, percent — damit der Lernpfad
// bei erledigten Modulen die erreichte Prozentzahl anzeigen kann.
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
async function loadTopicRows(topicIds: string[]): Promise<TopicRow[]> {
  if (topicIds.length === 0) return [];
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('topics')
    .select('id, slug, label, description, schulstufe, kompetenzbereich, sort_order')
    .in('id', topicIds);
  if (error) {
    throw new Error(`Themen-Metadaten konnten nicht geladen werden: ${error.message}`);
  }
  return (data ?? []) as TopicRow[];
}

// Schritt 4: Topic-Karte für eine Schüler:in fertig montieren.
function buildStudentTopic(
  t: TopicRow,
  stubs: StudentTopicModuleStub[],
  progressByModule: Map<string, ProgressInfo>
): StudentTopic {
  const modules: StudentTopicModule[] = stubs
    .map((s) => {
      const info = progressByModule.get(s.moduleId);
      return {
        moduleId: s.moduleId,
        title: s.title,
        activityKind: s.activityKind,
        sortOrder: s.sortOrder,
        status: info?.status ?? 'open',
        percent: info?.percent ?? null,
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, 'de'));
  const agg = aggregateTopicStatus(modules.map((m) => m.status));
  return {
    topicId: t.id,
    slug: t.slug,
    label: t.label,
    description: t.description,
    schulstufe: t.schulstufe,
    kompetenzbereich: t.kompetenzbereich,
    sortOrder: t.sort_order,
    status: agg.status,
    total: agg.total,
    done: agg.done,
    inProgress: agg.inProgress,
    modules,
  };
}

// Sortier-Reihenfolge auf dem Schüler-Dashboard: in_progress zuerst, dann
// open, dann done. Innerhalb der gleichen Status-Stufe nach Stufe + sort_order.
const TOPIC_PRIORITY: Record<TopicStatus, number> = { in_progress: 0, open: 1, done: 2 };

function sortStudentTopics(topics: StudentTopic[]): StudentTopic[] {
  return topics.sort((a, b) => {
    const p = TOPIC_PRIORITY[a.status] - TOPIC_PRIORITY[b.status];
    if (p !== 0) return p;
    const stA = a.schulstufe ?? 99;
    const stB = b.schulstufe ?? 99;
    if (stA !== stB) return stA - stB;
    return a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, 'de');
  });
}

// Hauptfunktion: Themen-Karten für das Schüler-Dashboard.
export async function getAssignedTopicsForStudent(
  classId: string,
  studentCodeId: string
): Promise<StudentTopic[]> {
  const { moduleIdsByTopic } = await loadAssignmentsForStudent(classId);
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

// Ein einzelnes Thema per Slug (für die Themen-Detailseite). Liefert null
// wenn das Thema nicht der Klasse zugewiesen ist oder den Slug nicht gibt.
export async function getAssignedTopicBySlug(
  classId: string,
  studentCodeId: string,
  slug: string
): Promise<StudentTopic | null> {
  const all = await getAssignedTopicsForStudent(classId, studentCodeId);
  return all.find((t) => t.slug === slug) ?? null;
}
