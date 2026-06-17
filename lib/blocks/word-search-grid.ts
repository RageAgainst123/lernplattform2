// Pure Gitter-Ableitung fürs Wortsuchrätsel (word_search). Wie beim
// Kreuzworträtsel platziert der/die Autor:in die Wörter selbst (kein
// Auto-Placement-Solver); die Lösungs-Zellen werden abgeleitet. Zusätzlich:
//   - deterministische Füllbuchstaben (seeded Hash, KEIN Math.random —
//     hydration-sicher und über Reloads stabil),
//   - Auswahl-Logik (Start-/End-Zelle → Zellpfad → welches Wort?).
// Geteilt von Schema-superRefine, Renderer, Editor-Vorschau und
// validate-module.mjs. Bewusst OHNE Import aus lib/schemas → kein Zirkel.

export type WordSearchDirection = 'across' | 'down' | 'diag'; // diag = nach rechts unten

export type WordSearchWordLike = {
  id: string;
  word: string;
  direction: WordSearchDirection;
  row: number; // Startzelle (0-basiert)
  col: number;
};

export type WordSearchIssue =
  | { type: 'outOfGrid'; wordId: string }
  | { type: 'conflict'; wordId: string; r: number; c: number; existing: string; incoming: string };

export const cellKey = (r: number, c: number): string => `${r},${c}`;

const DELTA: Record<WordSearchDirection, { dr: number; dc: number }> = {
  across: { dr: 0, dc: 1 },
  down: { dr: 1, dc: 0 },
  diag: { dr: 1, dc: 1 },
};

// Alle Zellen, die ein Wort abdeckt (in Schreibrichtung).
export function wordCells(w: WordSearchWordLike): { r: number; c: number; letter: string }[] {
  const { dr, dc } = DELTA[w.direction];
  return [...w.word.toUpperCase()].map((letter, i) => ({
    r: w.row + i * dr,
    c: w.col + i * dc,
    letter,
  }));
}

// Lösungs-Zellen-Map ("r,c" → Buchstabe) + Probleme (ragt raus / Konflikt).
// Gleicher Buchstabe auf geteilter Zelle ist erlaubt (Wörter dürfen sich
// kreuzen, solange der Buchstabe passt).
export function buildWordSearchGrid(
  rows: number,
  cols: number,
  words: WordSearchWordLike[]
): { cells: Map<string, string>; issues: WordSearchIssue[] } {
  const cells = new Map<string, string>();
  const issues: WordSearchIssue[] = [];
  for (const w of words) {
    for (const { r, c, letter } of wordCells(w)) {
      if (r >= rows || c >= cols) {
        issues.push({ type: 'outOfGrid', wordId: w.id });
        break;
      }
      const key = cellKey(r, c);
      const existing = cells.get(key);
      if (existing !== undefined && existing !== letter) {
        issues.push({ type: 'conflict', wordId: w.id, r, c, existing, incoming: letter });
      } else {
        cells.set(key, letter);
      }
    }
  }
  return { cells, issues };
}

// Deterministischer Füllbuchstabe pro Zelle: FNV-1a-Hash über "seed:r:c" →
// A–Z. Über Server/Client/Reloads identisch (im Gegensatz zu Math.random).
const FILLER_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function fillerLetter(seed: string, r: number, c: number): string {
  const input = `${seed}:${r}:${c}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return FILLER_ALPHABET[hash % FILLER_ALPHABET.length]!;
}

// Zellpfad zwischen Start- und End-Zelle, wenn sie auf einer erlaubten Linie
// liegen (waagrecht, senkrecht oder 45°-Diagonale) — sonst null. Der Pfad
// läuft von start nach end (auch rückwärts/aufwärts möglich, damit die
// Schüler:in ein Wort in beide Richtungen markieren kann).
export function selectionPath(
  start: { r: number; c: number },
  end: { r: number; c: number }
): { r: number; c: number }[] | null {
  const dr = end.r - start.r;
  const dc = end.c - start.c;
  const aligned = dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc);
  if (!aligned) return null;
  const steps = Math.max(Math.abs(dr), Math.abs(dc));
  const sr = Math.sign(dr);
  const sc = Math.sign(dc);
  const path: { r: number; c: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    path.push({ r: start.r + i * sr, c: start.c + i * sc });
  }
  return path;
}

// Welches Wort entspricht der Auswahl? Vergleicht den Zellpfad (vorwärts ODER
// rückwärts) mit den Zellpfaden aller Wörter. null = keine Übereinstimmung.
export function findWordBySelection(
  words: WordSearchWordLike[],
  start: { r: number; c: number },
  end: { r: number; c: number }
): string | null {
  const path = selectionPath(start, end);
  if (!path) return null;
  const pathKeys = path.map((p) => cellKey(p.r, p.c)).join('|');
  const reversed = [...path]
    .reverse()
    .map((p) => cellKey(p.r, p.c))
    .join('|');
  for (const w of words) {
    const wordKeys = wordCells(w)
      .map((cl) => cellKey(cl.r, cl.c))
      .join('|');
    if (wordKeys === pathKeys || wordKeys === reversed) return w.id;
  }
  return null;
}
