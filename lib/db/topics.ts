import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import type { Topic, Kompetenzbereich } from '@/lib/schemas/entities';

// Read-Funktionen für Topics (Phase G). Topics sind die first-class Lernpfade
// — ein Thema bündelt Lernmodule + Präsentationen + Heft-Aufträge +
// Abschlusstest in einer Reihenfolge. RLS: alle dürfen lesen (öffentlich),
// schreiben nur via Service-Role im Admin-Bereich.

type TopicRow = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  schulstufe: number | null;
  kompetenzbereich: Kompetenzbereich | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function toTopic(row: TopicRow): Topic {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    description: row.description ?? undefined,
    schulstufe: row.schulstufe ?? undefined,
    kompetenzbereich: row.kompetenzbereich ?? undefined,
    isPublished: row.is_published,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Alle Themen für die Admin-Übersicht (auch unveröffentlichte). Sortiert nach
// Stufe + Bereich + Reihenfolge.
export async function getTopicsForAdmin(): Promise<Topic[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .order('schulstufe', { ascending: true, nullsFirst: false })
    .order('kompetenzbereich', { ascending: true, nullsFirst: false })
    .order('sort_order', { ascending: true });
  if (error) throw new Error(`Themen konnten nicht geladen werden: ${error.message}`);
  return (data as TopicRow[]).map(toTopic);
}

// Ein Thema per ID — für Admin-Edit-Seite. Service-Role um auch
// unveröffentlichte Themen zu sehen.
export async function getTopicByIdForAdmin(id: string): Promise<Topic | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from('topics').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`Thema konnte nicht geladen werden: ${error.message}`);
  return data ? toTopic(data as TopicRow) : null;
}

// Ein Thema per Slug — für öffentliche Detail-Seite /dgb/[stufe]/.../[slug].
// Nutzt User-Client (RLS erlaubt SELECT für alle).
export async function getTopicBySlug(
  schulstufe: number,
  kompetenzbereich: Kompetenzbereich,
  slug: string
): Promise<Topic | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('schulstufe', schulstufe)
    .eq('kompetenzbereich', kompetenzbereich)
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw new Error(`Thema konnte nicht geladen werden: ${error.message}`);
  return data ? toTopic(data as TopicRow) : null;
}

// Veröffentlichte Themen einer Stufe + Bereich (für öffentliche Listen).
export async function getPublishedTopics(
  schulstufe: number,
  kompetenzbereich?: Kompetenzbereich
): Promise<Topic[]> {
  const supabase = await createClient();
  let query = supabase
    .from('topics')
    .select('*')
    .eq('schulstufe', schulstufe)
    .eq('is_published', true)
    .order('sort_order', { ascending: true });
  if (kompetenzbereich) query = query.eq('kompetenzbereich', kompetenzbereich);
  const { data, error } = await query;
  if (error) throw new Error(`Themen konnten nicht geladen werden: ${error.message}`);
  return (data as TopicRow[]).map(toTopic);
}
