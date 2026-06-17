import { createClient } from '@/lib/supabase/server';
import type { StudentCode } from '@/lib/schemas/entities';

type StudentCodeRow = {
  id: string;
  class_id: string;
  codename: string;
  created_at: string;
  last_active_at: string | null;
  given_name: string | null;
  surname: string | null;
  o365_email: string | null;
};

function toStudentCode(row: StudentCodeRow): StudentCode {
  return {
    id: row.id,
    classId: row.class_id,
    codename: row.codename,
    createdAt: row.created_at,
    lastActiveAt: row.last_active_at,
    givenName: row.given_name,
    surname: row.surname,
    o365Email: row.o365_email,
  };
}

// Lädt die Schüler:innen-Codes einer Klasse (ohne pin_hash). RLS beschränkt auf
// Klassen der eingeloggten Lehrer:in (Policy student_codes_all_own).
export async function getStudentCodes(classId: string): Promise<StudentCode[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('student_codes')
    .select('id, class_id, codename, created_at, last_active_at, given_name, surname, o365_email')
    .eq('class_id', classId)
    .order('codename', { ascending: true });
  if (error) {
    throw new Error(`Codes konnten nicht geladen werden: ${error.message}`);
  }
  return (data as StudentCodeRow[]).map(toStudentCode);
}
