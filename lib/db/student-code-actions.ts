'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/teacher-auth';
import { generatePin, hashPin } from '@/lib/auth/pin';
import { buildCodenames, classSlug, nextCodeNumber } from '@/lib/db/codename';
import { getStudentCodes } from '@/lib/db/student-codes';

// Klartext-PIN nur als Rückgabe (einmalige Anzeige) — wird NIE gespeichert.
export type GeneratedCode = { codename: string; pin: string };
export type GenerateResult = { codes: GeneratedCode[]; error: string | null };

const MAX_CODES = 35;

// Generiert `count` neue Codes für eine Klasse: fortlaufende Codenamen +
// zufällige, bcrypt-gehashte PINs. Gibt die Klartext-PINs einmalig zurück.
export async function generateCodes(
  classId: string,
  count: number,
  className: string
): Promise<GenerateResult> {
  await requireUser();
  if (!Number.isInteger(count) || count < 1 || count > MAX_CODES) {
    return { codes: [], error: `Bitte eine Anzahl zwischen 1 und ${MAX_CODES} wählen.` };
  }

  const existing = await getStudentCodes(classId);
  const start = nextCodeNumber(existing.map((c) => c.codename));
  const codenames = buildCodenames(classSlug(className), start, count);

  const generated: GeneratedCode[] = codenames.map((codename) => ({
    codename,
    pin: generatePin(),
  }));

  const rows = await Promise.all(
    generated.map(async (g) => ({
      class_id: classId,
      codename: g.codename,
      pin_hash: await hashPin(g.pin),
    }))
  );

  const supabase = await createClient();
  const { error } = await supabase.from('student_codes').insert(rows);
  if (error) {
    return { codes: [], error: 'Die Codes konnten nicht angelegt werden.' };
  }

  revalidatePath(`/lehrer/klassen/${classId}`);
  return { codes: generated, error: null };
}

// Setzt für einen einzelnen Code eine neue PIN und gibt sie einmalig zurück.
export async function regeneratePin(
  codeId: string,
  classId: string
): Promise<{ pin: string | null; error: string | null }> {
  await requireUser();
  const pin = generatePin();
  const supabase = await createClient();
  const { error } = await supabase
    .from('student_codes')
    .update({ pin_hash: await hashPin(pin) })
    .eq('id', codeId);
  if (error) {
    return { pin: null, error: 'Die PIN konnte nicht neu gesetzt werden.' };
  }
  revalidatePath(`/lehrer/klassen/${classId}`);
  return { pin, error: null };
}
