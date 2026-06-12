import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import type { ActivityKind, DisplayMode, Kompetenzbereich, Module } from '@/lib/schemas/entities';

// Read-Funktionen für Module. Admin-Lese-Funktionen umgehen RLS NICHT —
// Geo ist auch Lehrer:in und kann seine eigenen Module sehen (created_by =
// auth.uid()). Für überklassen-Aggregation (alle Module + Counts) reicht das.

type ModuleRow = {
  id: string;
  title: string;
  description: string | null;
  schulstufe: number | null;
  kompetenzbereich: Kompetenzbereich | null;
  topic: string | null;
  topic_id: string | null;
  sort_order: number;
  content: unknown;
  estimated_minutes: number | null;
  is_published: boolean;
  activity_kind: ActivityKind;
  display_mode: DisplayMode | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

function toModule(row: ModuleRow): Module {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    schulstufe: row.schulstufe ?? undefined,
    kompetenzbereich: row.kompetenzbereich ?? undefined,
    topic: row.topic ?? undefined,
    topicId: row.topic_id,
    sortOrder: row.sort_order,
    content: row.content as Module['content'],
    estimatedMinutes: row.estimated_minutes ?? undefined,
    isPublished: row.is_published,
    activityKind: row.activity_kind,
    displayMode: row.display_mode ?? 'quiz',
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getModuleById(id: string): Promise<Module | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('modules').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`Modul konnte nicht geladen werden: ${error.message}`);
  return data ? toModule(data as ModuleRow) : null;
}

// Lehrer:in-Variante: liefert ein veröffentlichtes Modul auch dann, wenn die
// RLS-Policy-Auswertung mit dem User-Client kein Match liefert (z.B. weil der
// Lehrer:innen-User-Context die NULL-Klassen-Zuweisung in `class_modules`
// nicht durchgrooved hat). Wir nutzen Service-Role und filtern manuell auf
// is_published=true — Lehrer:innen dürfen alle veröffentlichten Module sehen
// (Plattform-Annahme, siehe RLS-Policy „modules_select_published_or_own"
// in Migration 0002 — gleicher Effekt, aber RLS-bypass-stabil).
//
// Phase-V-Hotfix (2026-06-05): nötig nachdem getModuleById in
// Lehrer-Page-Routen (praesentation, quiz-setup) gelegentlich null
// zurückgab obwohl is_published=true — Symptom: 404 nach Klick auf
// „Präsentieren" der via class_topics zugewiesenen Module.
export async function getPublishedModuleByIdForTeacher(id: string): Promise<Module | null> {
  const svc = createServiceClient();
  const { data, error } = await svc
    .from('modules')
    .select('*')
    .eq('id', id)
    .eq('is_published', true)
    .maybeSingle();
  if (error) throw new Error(`Modul konnte nicht geladen werden: ${error.message}`);
  return data ? toModule(data as ModuleRow) : null;
}

// Admin-Variante von getModuleById — umgeht RLS via Service-Role, damit der
// Autor:in-Editor JEDES Modul sehen + bearbeiten kann (auch Module die
// `is_published = false` sind UND von anderen Autor:innen erstellt wurden,
// falls später Co-Autoren dazukommen). Symmetrisch zu getModulesForAdmin.
// MUSS hinter requireAdmin() aufgerufen werden — sonst RLS-Bypass.
export async function getModuleByIdForAdmin(id: string): Promise<Module | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from('modules').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`Modul konnte nicht geladen werden: ${error.message}`);
  return data ? toModule(data as ModuleRow) : null;
}

// Alle Module für die Admin-Übersicht. Sortiert nach Update-Zeit (neueste zuerst).
// Hinweis: nach Phase E sollten Admin-Listen besser nach activity_kind filtern —
// siehe getModulesForAdminByKind() unten. Diese ungefilterte Variante bleibt für
// die Übersichts-Seite und Tests bestehen.
export async function getModulesForAdmin(): Promise<Module[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw new Error(`Module konnten nicht geladen werden: ${error.message}`);
  return (data as ModuleRow[]).map(toModule);
}

// Admin-Liste gefiltert nach Aktivität (Phase E). Wird von den neuen Routen
// /admin/lernmodule und /admin/praesentationen genutzt — so erscheinen
// Präsentationen nicht in der Lernmodul-Liste und umgekehrt.
export async function getModulesForAdminByKind(kind: ActivityKind): Promise<Module[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('activity_kind', kind)
    .order('updated_at', { ascending: false });
  if (error) throw new Error(`Module konnten nicht geladen werden: ${error.message}`);
  return (data as ModuleRow[]).map(toModule);
}

// Phase-V-Audit (V5): wie viele Schüler:innen haben dieses Modul bereits
// begonnen/abgeschlossen? Für den Warn-Banner im Editor — inhaltliche
// Änderungen an einem Modul mit Bestand-Fortschritt können gespeicherte
// Antworten/Scores inkonsistent machen. Service-Role: student_progress ist
// RLS-geschützt pro Schüler:in, der Admin braucht die Gesamtzahl.
// MUSS hinter requireAdmin() aufgerufen werden.
export async function getModuleProgressCount(moduleId: string): Promise<number> {
  const svc = createServiceClient();
  const { count, error } = await svc
    .from('student_progress')
    .select('*', { count: 'exact', head: true })
    .eq('module_id', moduleId);
  if (error) {
    throw new Error(`Fortschritts-Zahl konnte nicht geladen werden: ${error.message}`);
  }
  return count ?? 0;
}

export type ModuleOption = { id: string; title: string };

// Für das Material-Verknüpfungs-Dropdown: nur veröffentlichte Module derselben
// Stufe (+ optional Bereich, weil materials.kompetenzbereich nullable ist).
export async function getModulesForLink(
  schulstufe: number,
  bereich: Kompetenzbereich | null
): Promise<ModuleOption[]> {
  const supabase = await createClient();
  let query = supabase
    .from('modules')
    .select('id, title')
    .eq('schulstufe', schulstufe)
    .eq('is_published', true)
    .order('title');
  if (bereich) query = query.eq('kompetenzbereich', bereich);
  const { data, error } = await query;
  if (error) throw new Error(`Modul-Liste konnte nicht geladen werden: ${error.message}`);
  return (data as ModuleOption[]) ?? [];
}

// Phase G: Module eines Themas (für Admin-Themen-Editor + Schüler-Themen-
// Detailseite). Sortiert nach sort_order — die Reihenfolge im Lernpfad.
export async function getModulesForTopic(topicId: string): Promise<Module[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('topic_id', topicId)
    .order('sort_order', { ascending: true })
    .order('title', { ascending: true });
  if (error) throw new Error(`Module konnten nicht geladen werden: ${error.message}`);
  return (data as ModuleRow[]).map(toModule);
}

// Phase G: Module ohne Themen-Zuordnung — für das „+ Baustein hinzufügen"-
// Dropdown im Themen-Editor. Optional gefiltert auf eine Aktivität, damit
// das Dropdown nicht alle Module mischt.
export async function getModulesWithoutTopic(kind?: ActivityKind): Promise<ModuleOption[]> {
  const supabase = createServiceClient();
  let query = supabase
    .from('modules')
    .select('id, title')
    .is('topic_id', null)
    .order('title', { ascending: true });
  if (kind) query = query.eq('activity_kind', kind);
  const { data, error } = await query;
  if (error) throw new Error(`Modul-Liste konnte nicht geladen werden: ${error.message}`);
  return (data as ModuleOption[]) ?? [];
}

// Phase G2-Fix: erweitertes Add-Dropdown im Themen-Editor. Zeigt zusätzlich
// Module die schon einem ANDEREN Thema zugeordnet sind — beim Hinzufügen
// werden sie umgehängt (setModuleTopic überschreibt topic_id). Wichtig
// für Geos Workflow nach der Migration: alle EVA-Module sind automatisch
// einem Bestand-Thema „eva" zugeordnet, müssen aber ins neue „EVA-Prinzip-
// neu" umgehängt werden können.
export type ModuleOptionWithSource = {
  id: string;
  title: string;
  currentTopicLabel: string | null; // null = noch keinem Thema zugeordnet
};

export async function getAvailableModulesForTopic(
  currentTopicId: string,
  kind: ActivityKind
): Promise<ModuleOptionWithSource[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('modules')
    .select('id, title, topic_id, topics(label)')
    .eq('activity_kind', kind)
    .order('title', { ascending: true });
  if (error) throw new Error(`Modul-Liste konnte nicht geladen werden: ${error.message}`);
  type Row = {
    id: string;
    title: string;
    topic_id: string | null;
    topics: { label: string } | null;
  };
  return ((data ?? []) as unknown as Row[])
    .filter((r) => r.topic_id !== currentTopicId)
    .map((r) => ({
      id: r.id,
      title: r.title,
      currentTopicLabel: r.topics?.label ?? null,
    }));
}

export type PublishedModuleOption = {
  id: string;
  title: string;
  schulstufe: number | null;
};

// Für das Klassen-Modul-Zuweisungs-Dropdown (Lehrer:innen-Sicht): alle
// veröffentlichten Module über alle Stufen + Bereiche. Sortiert nach
// Schulstufe + Titel — Lehrer:in sieht die für ihre Klasse passenden zuerst.
export async function getPublishedModulesAll(): Promise<PublishedModuleOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('modules')
    .select('id, title, schulstufe')
    .eq('is_published', true)
    .order('schulstufe', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });
  if (error) throw new Error(`Modul-Liste konnte nicht geladen werden: ${error.message}`);
  return (data as PublishedModuleOption[]) ?? [];
}
