// Pure Helpers für den Buchstabensalat (scramble). Das Mischen ist SEEDED
// (FNV-1a + LCG statt Math.random) — Server- und Client-Render liefern
// dieselbe Reihenfolge (hydration-sicher) und sie bleibt über Reloads stabil.
// Geteilt von Renderer, Editor-Vorschau und Grading. Ohne lib/schemas-Import
// (strukturelle Typen) → kein Zirkel.

function hashSeed(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

// Buchstaben eines Worts deterministisch mischen (Fisher–Yates mit LCG).
// Ergäbe das Mischen die Original-Reihenfolge (bei kurzen Wörtern möglich),
// wird um 1 rotiert — sonst wäre nichts zu tun.
export function scrambledLetters(word: string, seed: string): string[] {
  const letters = [...word.toUpperCase()];
  if (letters.length < 2) return letters;
  let state = hashSeed(`${seed}:${word}`) || 1;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [letters[i], letters[j]] = [letters[j]!, letters[i]!];
  }
  if (letters.join('') === word.toUpperCase()) {
    letters.push(letters.shift()!);
  }
  return letters;
}

// Teilpunkte = richtig zusammengesetzte Wörter / alle Wörter.
export function gradeScrambleWords(
  block: { words: { id: string; word: string }[] },
  answer: Record<string, string>
): number {
  if (block.words.length === 0) return 0;
  const correct = block.words.filter(
    (w) => (answer[w.id] ?? '').toUpperCase() === w.word.toUpperCase()
  ).length;
  return correct / block.words.length;
}

// Rekonstruiert aus einem gespeicherten Antwort-String die verbrauchten
// Tile-Indizes (greedy, erste passende Vorkommen) — damit ein gespeicherter
// Entwurf den Pool-Zustand korrekt wiederherstellt, auch bei doppelten
// Buchstaben. Bricht ab, sobald ein Buchstabe nicht mehr im Pool ist.
export function usedTileIndices(tiles: string[], built: string): number[] {
  const used: number[] = [];
  for (const letter of [...built.toUpperCase()]) {
    const idx = tiles.findIndex((t, i) => t === letter && !used.includes(i));
    if (idx === -1) break;
    used.push(idx);
  }
  return used;
}
