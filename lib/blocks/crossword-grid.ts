// Pure Gitter-Ableitung für das Kreuzworträtsel (crossword). Die füllbaren
// Zellen werden aus den Wörtern ABGELEITET (Vereinigung aller abgedeckten
// Zellen) — der/die Autor:in pflegt nie eine Gitter-Matrix von Hand.
// Geteilt von Schema-superRefine, Grading (evaluate.ts), Schüler-Renderer,
// Editor-Vorschau und validate-module.mjs — analog hotspot-geometry.ts.
// Bewusst OHNE Import aus lib/schemas (strukturelle Typen) → kein Zirkel.

export type CrosswordWordLike = {
  id: string;
  answer: string;
  direction: 'across' | 'down';
  row: number; // Startzelle (0-basiert)
  col: number;
};

export type CrosswordIssue =
  | { type: 'outOfGrid'; wordId: string }
  | { type: 'conflict'; wordId: string; r: number; c: number; existing: string; incoming: string };

export const cellKey = (r: number, c: number): string => `${r},${c}`;

// Alle Zellen, die ein Wort abdeckt (across → rechts, down → runter).
export function wordCells(w: CrosswordWordLike): { r: number; c: number; letter: string }[] {
  return [...w.answer.toUpperCase()].map((letter, i) => ({
    r: w.direction === 'down' ? w.row + i : w.row,
    c: w.direction === 'across' ? w.col + i : w.col,
    letter,
  }));
}

// Baut die Lösungs-Zellen-Map ("r,c" → Buchstabe) + sammelt Probleme:
// Wort ragt aus dem Gitter / Kreuzungs-Konflikt (geteilte Zelle mit
// unterschiedlichen Buchstaben). Gleicher Buchstabe an einer Kreuzung ist
// korrekt und erwartet — die Zelle zählt via Map-Key nur einmal.
export function buildCrosswordGrid(
  rows: number,
  cols: number,
  words: CrosswordWordLike[]
): { cells: Map<string, string>; issues: CrosswordIssue[] } {
  const cells = new Map<string, string>();
  const issues: CrosswordIssue[] = [];
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

// Nur die Lösungs-Zellen (für das Grading).
export function crosswordSolutionCells(block: {
  rows: number;
  cols: number;
  words: CrosswordWordLike[];
}): Map<string, string> {
  return buildCrosswordGrid(block.rows, block.cols, block.words).cells;
}

// Klassische Kreuzwort-Nummerierung: jede Startzelle bekommt eine Nummer,
// zeilenweise von links oben. Wörter mit gleicher Startzelle (across + down)
// teilen sich die Nummer — wie im gedruckten Rätsel.
export function crosswordNumbering(words: CrosswordWordLike[]): {
  startNumbers: Map<string, number>; // cellKey der Startzelle → Nummer
  wordNumbers: Map<string, number>; // wordId → Nummer
} {
  const startKeys = [...new Set(words.map((w) => cellKey(w.row, w.col)))].sort((a, b) => {
    const [ra = 0, ca = 0] = a.split(',').map(Number);
    const [rb = 0, cb = 0] = b.split(',').map(Number);
    return ra - rb || ca - cb;
  });
  const startNumbers = new Map(startKeys.map((key, i) => [key, i + 1]));
  const wordNumbers = new Map(
    words.map((w) => [w.id, startNumbers.get(cellKey(w.row, w.col)) ?? 0])
  );
  return { startNumbers, wordNumbers };
}

// Teilpunkte: richtige Zellen / füllbare Zellen. ZELL-basiert statt
// wort-basiert — ein einzelner Tippfehler nullt nicht das ganze Wort
// (fairer für Stufe 5–8). Kreuzungszellen zählen via Map-Key nur einmal,
// Eingabe wird case-insensitiv verglichen. Lebt hier (nicht in evaluate.ts),
// damit die Zell-Logik an einem Ort bleibt + evaluate.ts unterm Zeilen-Limit.
export function gradeCrosswordCells(
  block: { rows: number; cols: number; words: CrosswordWordLike[] },
  answer: Record<string, string>
): number {
  const cells = crosswordSolutionCells(block);
  if (cells.size === 0) return 0;
  let ok = 0;
  for (const [key, sol] of cells) {
    if ((answer[key] ?? '').toUpperCase() === sol) ok++;
  }
  return ok / cells.size;
}
