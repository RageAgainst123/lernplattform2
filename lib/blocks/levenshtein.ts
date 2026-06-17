// Levenshtein-Distanz + Fuzzy-Match-Helper für Lückentext-Tippfehlertoleranz.
//
// Verwendung: lib/blocks/evaluate.ts → evalFillBlank()
// Spezifikation: docs/QUIZ-MODI-SPEZIFIKATION.md §9
//
// Pure JS, keine Dependency. Algorithmus klassische DP-Tabelle in zwei
// rollierenden Reihen (Speicher O(min(a,b)), Zeit O(a×b)). Reicht für
// einzelne Wörter (typisch < 30 Zeichen) locker.

/**
 * Klassische Levenshtein-Distanz (Edit-Distanz: Insertion, Deletion,
 * Substitution mit Kosten 1). Keine Transposition (Damerau-Erweiterung)
 * — die ist im Schul-Kontext selten wert.
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Zwei rollierende Reihen — wir brauchen immer nur die vorherige.
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1, // Insertion
        prev[j] + 1, // Deletion
        prev[j - 1] + cost // Substitution / Match
      );
    }
    prev = curr.slice();
  }
  return prev[b.length];
}

/**
 * Tippfehlertoleranter Wort-Vergleich für Lückentext.
 *
 * Regel (siehe Spec §9):
 * - Trimmen + lowercase beide Seiten.
 * - Wenn das längere Wort < 4 Zeichen: nur exakt match.
 * - Wenn das längere Wort ≥ 4 Zeichen: Levenshtein-Distanz ≤ 1 akzeptieren
 *   (genau ein Edit: Vertipper / fehlender Buchstabe / Extra-Buchstabe).
 *
 * Leere Strings auf einer Seite werden als „kein Match" gewertet (Schutz
 * gegen „Antwort vergessen → wird als ok gewertet"-Fallen).
 */
export function isFuzzyMatch(input: string, solution: string): boolean {
  const a = input.trim().toLowerCase();
  const b = solution.trim().toLowerCase();
  if (a === b) return a.length > 0;
  if (a.length === 0 || b.length === 0) return false;
  const longerLength = Math.max(a.length, b.length);
  if (longerLength < 4) return false;
  return levenshtein(a, b) <= 1;
}
