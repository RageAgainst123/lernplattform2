// Zerlegt einen Lückentext in Segmente: Strings (fester Text) und Zahlen
// (Lücken-Index aus {0}, {1}, …). Beispiel:
//   "Ein {0} ist ein {1}." → ['Ein ', 0, ' ist ein ', 1, '.']
export type FillSegment = string | number;

export function parseFillText(text: string): FillSegment[] {
  const segments: FillSegment[] = [];
  const regex = /\{(\d+)\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push(text.slice(lastIndex, match.index));
    }
    segments.push(Number(match[1]));
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push(text.slice(lastIndex));
  }
  return segments;
}

// Mischt ein Array deterministisch-zufällig (Fisher-Yates). Für den Wortpool.
export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
