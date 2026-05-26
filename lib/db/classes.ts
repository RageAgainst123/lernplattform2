import { createClient } from '@/lib/supabase/server';
import type { Class } from '@/lib/schemas/entities';

// Lese-Queries für Klassen. RLS sorgt dafür, dass nur eigene Klassen sichtbar sind
// (Policy classes_all_own) — kein zusätzlicher teacher_id-Filter nötig.

type ClassRow = {
  id: string;
  teacher_id: string;
  name: string;
  schulstufe: number | null;
  join_code: string;
  created_at: string;
  updated_at: string;
};

function toClass(row: ClassRow): Class {
  return {
    id: row.id,
    teacherId: row.teacher_id,
    name: row.name,
    schulstufe: row.schulstufe ?? undefined,
    joinCode: row.join_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getClasses(): Promise<Class[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .order('name', { ascending: true });
  if (error) {
    throw new Error(`Klassen konnten nicht geladen werden: ${error.message}`);
  }
  return (data as ClassRow[]).map(toClass);
}

export async function getClass(id: string): Promise<Class | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('classes').select('*').eq('id', id).maybeSingle();
  if (error) {
    throw new Error(`Klasse konnte nicht geladen werden: ${error.message}`);
  }
  return data ? toClass(data as ClassRow) : null;
}
