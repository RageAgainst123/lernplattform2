import { createClient } from '@/lib/supabase/server';
import type { Kompetenzbereich, MaterialType } from '@/lib/schemas/entities';

// Read-Funktionen für Materialien aus Admin-Sicht (alle, inkl. is_teacher_only).
// Öffentliche Read-Funktionen leben in lib/db/public-content.ts.

export type AdminMaterial = {
  id: string;
  title: string;
  description: string | null;
  schulstufe: number | null;
  kompetenzbereich: Kompetenzbereich | null;
  topic: string | null;
  materialType: MaterialType;
  filePath: string;
  isTeacherOnly: boolean;
  relatedModuleId: string | null;
  relatedModuleTitle: string | null;
  createdAt: string;
};

type MaterialRow = {
  id: string;
  title: string;
  description: string | null;
  schulstufe: number | null;
  kompetenzbereich: Kompetenzbereich | null;
  topic: string | null;
  material_type: MaterialType;
  file_path: string;
  is_teacher_only: boolean;
  related_module_id: string | null;
  created_at: string;
  modules?: { title: string } | null;
};

function toAdminMaterial(row: MaterialRow): AdminMaterial {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    schulstufe: row.schulstufe,
    kompetenzbereich: row.kompetenzbereich,
    topic: row.topic,
    materialType: row.material_type,
    filePath: row.file_path,
    isTeacherOnly: row.is_teacher_only,
    relatedModuleId: row.related_module_id,
    relatedModuleTitle: row.modules?.title ?? null,
    createdAt: row.created_at,
  };
}

export async function getMaterialsForAdmin(): Promise<AdminMaterial[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('materials')
    .select('*, modules:related_module_id(title)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Materialien konnten nicht geladen werden: ${error.message}`);
  return (data as MaterialRow[]).map(toAdminMaterial);
}

export async function getMaterialByIdForAdmin(id: string): Promise<AdminMaterial | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('materials')
    .select('*, modules:related_module_id(title)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`Material konnte nicht geladen werden: ${error.message}`);
  return data ? toAdminMaterial(data as MaterialRow) : null;
}
