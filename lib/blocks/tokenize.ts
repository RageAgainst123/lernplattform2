// Geteilte Tokenisierung für den mark_words-Block (Markieren-im-Text).
//
// KRITISCH: Renderer, Admin-Form UND validate-module nutzen GENAU diese
// Funktion. Würden sie verschieden tokenisieren, driften die Wort-Indizes
// auseinander → die als „richtig" gespeicherten Indizes zeigen auf falsche
// Wörter. Deshalb eine einzige Pure-Funktion, test-first.
//
// Modell: Der Text wird in Tokens zerlegt. Ein Token ist ENTWEDER ein Wort
// (markierbar) ODER eine Lücke/Satzzeichen (nicht markierbar). Nur Wort-Tokens
// bekommen einen fortlaufenden `wordIndex` (0-basiert). Die Lösung des Blocks
// und die Schüler:innen-Antwort referenzieren ausschließlich diese wordIndex-
// Werte — stabil gegenüber Whitespace/Satzzeichen.

export type Token = {
  text: string;
  isWord: boolean;
  // Nur bei isWord=true gesetzt: 0-basierter Index unter den Wort-Tokens.
  wordIndex: number | null;
};

// Wort = zusammenhängende Folge von Buchstaben/Ziffern (inkl. deutscher
// Umlaute und ß). Alles andere (Leerzeichen, Satzzeichen, Bindestriche,
// Klammern) ist ein Nicht-Wort-Token. Unicode-aware via \p{L}\p{N}.
const WORD_RE = /[\p{L}\p{N}]+/gu;

export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let lastEnd = 0;
  let wordIndex = 0;
  for (const match of text.matchAll(WORD_RE)) {
    const start = match.index;
    // Nicht-Wort-Teil vor diesem Wort (kann leer sein → übersprungen).
    if (start > lastEnd) {
      tokens.push({ text: text.slice(lastEnd, start), isWord: false, wordIndex: null });
    }
    tokens.push({ text: match[0], isWord: true, wordIndex: wordIndex++ });
    lastEnd = start + match[0].length;
  }
  // Rest hinter dem letzten Wort.
  if (lastEnd < text.length) {
    tokens.push({ text: text.slice(lastEnd), isWord: false, wordIndex: null });
  }
  return tokens;
}

// Anzahl der markierbaren Wörter (= höchster wordIndex + 1). Für Validierung:
// alle correctIndices müssen < wordCount sein.
export function wordCount(text: string): number {
  return [...text.matchAll(WORD_RE)].length;
}
