// Pure-Helper: erzeugt einen sauberen Slug aus (vorname, nachname, email).
// Wird beim ersten SSO-Beitritt zum Codename — Pseudonym, eindeutig pro
// Klasse via Suffix-Kollisions-Logik in student-sso.ts.
//
// Reihenfolge der Fallbacks:
//   1. "vorname.nachname" wenn beides gesetzt
//   2. nur vorname / nur nachname
//   3. email-Lokalteil ("max.muster" aus "max.muster@x.at")
//   4. Fallback "sso-user"
//
// Erlaubte Zeichen: a-z 0-9 . - · max 80 Zeichen.

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '')
    .replace(/\.+/g, '.')
    .replace(/^[.-]+|[.-]+$/g, '');
}

export function buildCodenameBase(givenName: string, surname: string, email: string): string {
  const given = slug(givenName);
  const sur = slug(surname);
  if (given && sur) return `${given}.${sur}`.slice(0, 80);
  if (given) return given.slice(0, 80);
  if (sur) return sur.slice(0, 80);

  const local = email.includes('@') ? (email.split('@')[0] ?? '') : email;
  const emailSlug = slug(local);
  if (emailSlug) return emailSlug.slice(0, 80);

  return 'sso-user';
}
