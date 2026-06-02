import 'server-only';
import { createServiceClient } from '@/lib/supabase/admin';
import { normalizeJoinCode } from '@/lib/db/join-code';

// Phase O2: O365-SSO-Schüler:innen-DB-Helpers.
//
// Eine Schüler:in mit O365 ist eine `student_codes`-Row mit gesetztem
// `o365_oid` (Microsoft Object ID), `o365_email`, `given_name`, `surname`
// und NULL pin_hash. Pro Klassen-Mitgliedschaft eine eigene Row — ein
// Kind in 3 Klassen hat 3 Rows mit gleicher o365_oid.
//
// Sicherheit: alle Queries laufen über Service-Role-Client (kein
// auth.uid() für Schüler:innen). Owner-Check geschieht in der Server-
// Action — `oid` kommt IMMER aus dem sso_pending-Cookie (jose-signiert),
// nie aus Client-Param.

export type StudentSsoMembership = {
  studentCodeId: string;
  classId: string;
  className: string;
  codename: string;
};

// Alle Klassen-Mitgliedschaften eines O365-Users finden (über alle Klassen).
// Sortiert: zuletzt aktive zuerst, damit bei mehreren Klassen die "lebendige"
// als Default für den Auto-Login genutzt werden kann.
export async function findStudentMembershipsByO365Oid(
  oid: string
): Promise<StudentSsoMembership[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('student_codes')
    .select('id, class_id, codename, classes(name)')
    .eq('o365_oid', oid)
    .order('last_active_at', { ascending: false, nullsFirst: false });
  if (error) {
    throw new Error(`Klassen-Mitgliedschaften nicht ladbar: ${error.message}`);
  }
  type Row = {
    id: string;
    class_id: string;
    codename: string;
    classes: { name: string } | null;
  };
  return ((data ?? []) as unknown as Row[])
    .filter((r) => r.classes !== null)
    .map((r) => ({
      studentCodeId: r.id,
      classId: r.class_id,
      className: r.classes!.name,
      codename: r.codename,
    }));
}

// Klassen-Beitritt nach SSO. Ergebnis-Typ mit explizitem Fehler-Discriminator
// damit der Page-Handler nicht raten muss.
export type JoinClassResult =
  | { ok: true; studentCodeId: string; classId: string }
  | { ok: false; error: 'invalid_code' | 'already_in_class' | 'internal_error'; message?: string };

// Generiert einen eindeutigen Codename für den SSO-Eintrag.
// Pattern: "vorname.nachname" lowercase, bei Kollision mit -2, -3, ...
async function uniqueCodename(
  classId: string,
  givenName: string,
  surname: string
): Promise<string> {
  const supabase = createServiceClient();
  const base =
    `${givenName}.${surname}`
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '')
      .slice(0, 80) || 'sso-user';
  // Bestehende Codenamen in der Klasse mit demselben Prefix laden
  const { data } = await supabase
    .from('student_codes')
    .select('codename')
    .eq('class_id', classId)
    .ilike('codename', `${base}%`);
  const taken = new Set((data ?? []).map((r) => (r.codename as string).toLowerCase()));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

async function findClassByJoinCode(
  code: string
): Promise<{ ok: true; classId: string } | { ok: false; result: JoinClassResult }> {
  const supabase = createServiceClient();
  const { data: cls, error } = await supabase
    .from('classes')
    .select('id')
    .eq('join_code', code)
    .maybeSingle();
  if (error) {
    return { ok: false, result: { ok: false, error: 'internal_error', message: error.message } };
  }
  if (!cls) {
    return { ok: false, result: { ok: false, error: 'invalid_code' } };
  }
  return { ok: true, classId: cls.id as string };
}

async function insertSsoMembership(args: {
  classId: string;
  oid: string;
  email: string;
  givenName: string;
  surname: string;
}): Promise<JoinClassResult> {
  const supabase = createServiceClient();
  const codename = await uniqueCodename(args.classId, args.givenName, args.surname);
  const { data: inserted, error: insertError } = await supabase
    .from('student_codes')
    .insert({
      class_id: args.classId,
      codename,
      o365_oid: args.oid,
      o365_email: args.email,
      given_name: args.givenName,
      surname: args.surname,
      sso_first_login_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (insertError || !inserted) {
    return {
      ok: false,
      error: 'internal_error',
      message: insertError?.message ?? 'Insert fehlgeschlagen.',
    };
  }
  return { ok: true, studentCodeId: inserted.id as string, classId: args.classId };
}

// Klassen-Beitritt für O365-User. Idempotent: bei wiederholtem Beitritt
// wird `already_in_class` zurückgegeben (kein Fehler, aber UI kann
// freundlich reagieren). Sonst neue Row anlegen + studentCodeId zurück.
export async function joinClassWithO365(args: {
  oid: string;
  email: string;
  givenName: string;
  surname: string;
  joinCode: string;
}): Promise<JoinClassResult> {
  const supabase = createServiceClient();
  const classLookup = await findClassByJoinCode(normalizeJoinCode(args.joinCode));
  if (!classLookup.ok) return classLookup.result;
  const classId = classLookup.classId;

  const { data: existing } = await supabase
    .from('student_codes')
    .select('id')
    .eq('o365_oid', args.oid)
    .eq('class_id', classId)
    .maybeSingle();
  if (existing) {
    return { ok: true, studentCodeId: existing.id as string, classId };
  }

  return insertSsoMembership({
    classId,
    oid: args.oid,
    email: args.email,
    givenName: args.givenName,
    surname: args.surname,
  });
}

// Touch last_active_at — wird beim Login aufgerufen (sowohl beim ersten
// Beitritt als auch bei jedem Folge-Login).
export async function touchStudentLastActive(studentCodeId: string): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from('student_codes')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', studentCodeId);
}
