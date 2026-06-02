// Display-Namen-Helper für Schüler:innen (Header, Codes-Liste, Begrüßung).
//
// Reihenfolge:
//   1. "Vorname Nachname" wenn beide vorhanden (SSO-Schüler:innen)
//   2. nur Vorname falls Nachname fehlt
//   3. Email-Lokalteil als Fallback (SSO ohne Namen)
//   4. codename als letzter Fallback (Code+PIN-Schüler:innen oder defekte SSO)
//
// Wichtig: Helper ist pure → testbar ohne DB.

export type StudentDisplayInput = {
  codename: string | null;
  givenName?: string | null;
  surname?: string | null;
  o365Email?: string | null;
};

function fromName(given: string, surname: string): string | null {
  if (given && surname) return `${given} ${surname}`;
  if (given) return given;
  if (surname) return surname;
  return null;
}

function fromEmail(email: string): string | null {
  if (!email.includes('@')) return null;
  const local = email.split('@')[0] ?? '';
  return local.length > 0 ? local : null;
}

function fromCodename(code: string): string | null {
  if (!code || code === '.' || code === 'sso-user') return null;
  return code;
}

export function studentDisplayName(input: StudentDisplayInput): string {
  return (
    fromName((input.givenName ?? '').trim(), (input.surname ?? '').trim()) ??
    fromEmail((input.o365Email ?? '').trim()) ??
    fromCodename((input.codename ?? '').trim()) ??
    'Schüler:in'
  );
}
