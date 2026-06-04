'use client';

import { useState } from 'react';
import type { BlockAnswer } from '@/lib/blocks/evaluate';
import type { SafeBlock } from '@/app/api/quiz/question/route';

// Antwort-Buttons für Schüler:innen-Quiz-Overlay (Phase S2.D).
// Ausgelagert aus QuizQuestionOverlay damit die Hauptdatei unter 200 Zeilen
// bleibt. Drei Block-Typen: multiple_choice, true_false, fill_blank.

const MC_COLORS = [
  { bg: 'bg-rose-500 hover:bg-rose-600 active:bg-rose-700', symbol: '▲' },
  { bg: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700', symbol: '◆' },
  { bg: 'bg-amber-400 hover:bg-amber-500 active:bg-amber-600', symbol: '●' },
  { bg: 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700', symbol: '■' },
  { bg: 'bg-purple-500 hover:bg-purple-600 active:bg-purple-700', symbol: '▼' },
  { bg: 'bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700', symbol: '★' },
] as const;

export function QuizAnswerButtons({
  block,
  pending,
  onSubmit,
}: {
  block: SafeBlock;
  pending: boolean;
  onSubmit: (answer: BlockAnswer) => void;
}) {
  if (block.type === 'multiple_choice') {
    return <McButtons options={block.options} pending={pending} onSubmit={onSubmit} />;
  }
  if (block.type === 'true_false') {
    return <TfButtons pending={pending} onSubmit={onSubmit} />;
  }
  return <FillBlankInput pending={pending} onSubmit={onSubmit} />;
}

function McButtons({
  options,
  pending,
  onSubmit,
}: {
  options: { id: string; text: string }[];
  pending: boolean;
  onSubmit: (answer: BlockAnswer) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {options.map((opt, i) => {
        const style = MC_COLORS[i % MC_COLORS.length];
        return (
          <button
            key={opt.id}
            type="button"
            disabled={pending}
            onClick={() => onSubmit([opt.id])}
            className={`flex items-center gap-3 rounded-2xl ${style.bg} px-5 py-6 text-left text-lg font-semibold text-white shadow-md disabled:opacity-50`}
          >
            <span aria-hidden className="text-3xl">
              {style.symbol}
            </span>
            <span className="flex-1">{opt.text}</span>
          </button>
        );
      })}
    </div>
  );
}

function TfButtons({
  pending,
  onSubmit,
}: {
  pending: boolean;
  onSubmit: (answer: BlockAnswer) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => onSubmit(true)}
        className="rounded-2xl bg-emerald-500 px-5 py-8 text-2xl font-semibold text-white shadow-md hover:bg-emerald-600 disabled:opacity-50"
      >
        ✓ Wahr
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => onSubmit(false)}
        className="rounded-2xl bg-rose-500 px-5 py-8 text-2xl font-semibold text-white shadow-md hover:bg-rose-600 disabled:opacity-50"
      >
        ✗ Falsch
      </button>
    </div>
  );
}

function FillBlankInput({
  pending,
  onSubmit,
}: {
  pending: boolean;
  onSubmit: (answer: BlockAnswer) => void;
}) {
  const [value, setValue] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.trim()) return;
        onSubmit([value.trim()]);
      }}
      className="flex flex-col gap-3"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
        disabled={pending}
        maxLength={120}
        placeholder="Deine Antwort…"
        className="border-input bg-background h-12 w-full rounded-md border px-4 text-base"
      />
      <button
        type="submit"
        disabled={pending || !value.trim()}
        className="rounded-md bg-violet-600 px-4 py-3 text-base font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
      >
        {pending ? 'Sende…' : 'Antwort senden'}
      </button>
    </form>
  );
}
