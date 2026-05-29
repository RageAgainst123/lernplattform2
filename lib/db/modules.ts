import { createClient } from '@/lib/supabase/server';
import type { Module, Kompetenzbereich, DisplayMode } from '@/lib/schemas/entities';

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
  content: unknown;
  estimated_minutes: number | null;
  is_published: boolean;
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
    content: row.content as Module['content'],
    estimatedMinutes: row.estimated_minutes ?? undefined,
    isPublished: row.is_published,
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

// Alle Module für die Admin-Übersicht. Sortiert nach Update-Zeit (neueste zuerst).
export async function getModulesForAdmin(): Promise<Module[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw new Error(`Module konnten nicht geladen werden: ${error.message}`);
  return (data as ModuleRow[]).map(toModule);
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
