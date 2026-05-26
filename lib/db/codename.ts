// Pure-Helper für Schüler:innen-Codenamen. Format: <SLUG>-NN (z. B. 5A-01).
// Codename ohne Personenbezug (DSGVO).

// Leitet aus dem Klassennamen einen kurzen Slug ab: erster Token, nur
// Buchstaben/Ziffern, Großbuchstaben. "5A 2026/27" → "5A". Fallback "KL".
export function classSlug(className: string): string {
  const firstToken = className.trim().split(/\s+/)[0] ?? '';
  const cleaned = firstToken.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return cleaned || 'KL';
}

// Bildet einen Codenamen aus Slug und laufender Nummer (1-basiert, 2-stellig
// mit führender Null, ab 100 ohne Padding).
export function buildCodename(slug: string, index: number): string {
  return `${slug}-${String(index).padStart(2, '0')}`;
}

// Erzeugt `count` fortlaufende Codenamen ab Startnummer `start` (1-basiert).
export function buildCodenames(slug: string, start: number, count: number): string[] {
  return Array.from({ length: count }, (_, i) => buildCodename(slug, start + i));
}

// Ermittelt die nächste freie laufende Nummer aus vorhandenen Codenamen.
// Liest die Zahl nach dem letzten "-"; ignoriert nicht passende Einträge.
// Leere Liste → 1.
export function nextCodeNumber(existingCodenames: string[]): number {
  const numbers = existingCodenames
    .map((name) => Number(name.slice(name.lastIndexOf('-') + 1)))
    .filter((n) => Number.isInteger(n) && n > 0);
  return numbers.length === 0 ? 1 : Math.max(...numbers) + 1;
}
