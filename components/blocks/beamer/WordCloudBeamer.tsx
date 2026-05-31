'use client';

import { useEffect, useState } from 'react';
import type { WordCloudBlock } from '@/lib/schemas/blocks';
import { getWordCloudResults } from '@/lib/db/live-results-action';

// Beamer-Darstellung einer Wortwolke. Pollt free_text-Stimmen und zeigt Wörter
// als Flexbox-Liste — häufigere Wörter in größerer Schrift (1rem–3rem).
// Keine externe Lib nötig.
const POLL_MS = 1500;

type WordEntry = { word: string; count: number };

function useWordCloud(classId: string, blockId: string): WordEntry[] {
  const [words, setWords] = useState<WordEntry[]>([]);
  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const res = await getWordCloudResults(classId, blockId);
      if (!cancelled && Array.isArray(res)) setWords(res);
    }
    void poll();
    const timer = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [classId, blockId]);
  return words;
}

function fontSize(count: number, max: number): string {
  if (max <= 1) return '1.5rem';
  const ratio = count / max;
  const size = 1 + ratio * 2; // 1rem – 3rem
  return `${size.toFixed(2)}rem`;
}

export function WordCloudBeamer({ block, classId }: { block: WordCloudBlock; classId: string }) {
  const words = useWordCloud(classId, block.id);
  const max = Math.max(1, ...words.map((w) => w.count));

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-8">
      <h2 className="text-center text-4xl font-bold tracking-tight sm:text-5xl">
        {block.question}
      </h2>
      {words.length === 0 ? (
        <p className="text-muted-foreground">Warte auf Beiträge…</p>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-4 p-4">
          {words.map(({ word, count }) => (
            <span
              key={word}
              className="text-foreground font-semibold transition-all duration-500"
              style={{ fontSize: fontSize(count, max) }}
            >
              {word}
            </span>
          ))}
        </div>
      )}
      <p className="text-muted-foreground text-sm">
        {words.length} verschiedene Wörter · {words.reduce((s, w) => s + w.count, 0)} Beiträge
      </p>
    </div>
  );
}
