import 'server-only';
import { createServiceClient } from '@/lib/supabase/admin';
import { normalizeJoinCode } from '@/lib/db/join-code';

// Schüler:innen-Login-Queries. Laufen über den Service-Role-Client (kein
// auth.uid() für Schüler:innen) und sind streng auf die jeweilige Klasse
// (join_code) begrenzt.

export type ClassPublic = { id: string; name: string };

// Findet die Klasse zu einem Beitrittscode (für die Login-Seite).
export async function getClassByJoinCode(joinCode: string): Promise<ClassPublic | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('classes')
    .select('id, name')
    .eq('join_code', normalizeJoinCode(joinCode))
    .maybeSingle();
  return data ? { id: data.id, name: data.name } : null;
}

// Liefert die Codenamen einer Klasse für das Login-Dropdown (ohne pin_hash).
export async function getCodenamesForClass(classId: string): Promise<string[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('student_codes')
    .select('codename')
    .eq('class_id', classId)
    .order('codename', { ascending: true });
  return (data ?? []).map((row) => row.codename as string);
}

// Holt den Codenamen zu einer student_code_id (für die Begrüßung im Dashboard).
export async function getCodenameById(studentCodeId: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('student_codes')
    .select('codename')
    .eq('id', studentCodeId)
    .maybeSingle();
  return data ? (data.codename as string) : null;
}

// Holt id + pin_hash eines Codenamens innerhalb einer Klasse (für die PIN-Prüfung).
export async function getStudentCodeForLogin(
  classId: string,
  codename: string
): Promise<{ id: string; pinHash: string } | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('student_codes')
    .select('id, pin_hash')
    .eq('class_id', classId)
    .eq('codename', codename)
    .maybeSingle();
  return data ? { id: data.id, pinHash: data.pin_hash as string } : null;
}
