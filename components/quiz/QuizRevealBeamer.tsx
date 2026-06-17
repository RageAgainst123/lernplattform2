import type { QuizBeamerQuestionState } from '@/lib/db/quiz-beamer-state';
import type { Block } from '@/lib/schemas/blocks';

// Reveal-Bildschirm nach einer Quiz-Frage (Phase S2.C).
// Zeigt: Frage + Antwort-Verteilung (Balken pro Option) + richtige Lösung
// grün markiert + Quote „X% richtig". Wird im status='between_questions'
// gerendert oder direkt nach Auto-Reveal bei „N/N geantwortet".

type Props = {
  state: QuizBeamerQuestionState;
};

export function QuizRevealBeamer({ state }: Props) {
  const { block, distribution, answered, total, correctRate } = state;
  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-white">
      <RevealHeader
        answered={answered}
        total={total}
        correctRate={correctRate}
        questionIndex={state.questionIndex}
      />
      <main className="flex flex-1 flex-col items-center gap-8 p-8">
        <h2 className="max-w-5xl text-center text-3xl font-bold md:text-4xl">
          {questionText(block)}
        </h2>
        <DistributionBars block={block} distribution={distribution} answered={answered} />
      </main>
    </div>
  );
}

function RevealHeader({
  answered,
  total,
  correctRate,
  questionIndex,
}: {
  answered: number;
  total: number;
  correctRate: number;
  questionIndex: number;
}) {
  const percent = Math.round(correctRate * 100);
  return (
    <header className="flex items-center justify-between border-b border-slate-700 px-8 py-4">
      <p className="text-sm font-medium tracking-wide text-slate-400 uppercase">
        Frage {questionIndex + 1} · Auflösung
      </p>
      <p className="text-2xl font-semibold tabular-nums">
        {percent}% richtig
        <span className="ml-2 text-sm font-normal text-slate-400">
          ({answered}/{total} geantwortet)
        </span>
      </p>
    </header>
  );
}

type BarRow = { label: string; count: number; isCorrect: boolean };

function DistributionBars({
  block,
  distribution,
  answered,
}: {
  block: Block;
  distribution: { key: string; count: number }[];
  answered: number;
}) {
  const rows = buildBarRows(block, distribution);
  const max = Math.max(answered, 1);
  return (
    <div className="w-full max-w-4xl space-y-3">
      {rows.map((r) => (
        <Bar key={r.label} row={r} max={max} answered={answered} />
      ))}
    </div>
  );
}

function Bar({ row, max, answered }: { row: BarRow; max: number; answered: number }) {
  const pct = Math.round((row.count / max) * 100);
  const share = answered > 0 ? Math.round((row.count / answered) * 100) : 0;
  return (
    <div
      className={`relative overflow-hidden rounded-xl border-2 px-5 py-4 ${
        row.isCorrect ? 'border-emerald-400 bg-emerald-950/40' : 'border-slate-700 bg-slate-800/60'
      }`}
    >
      <div
        className={`absolute inset-y-0 left-0 ${
          row.isCorrect ? 'bg-emerald-600/30' : 'bg-slate-700/40'
        }`}
        style={{ width: `${pct}%` }}
        aria-hidden
      />
      <div className="relative flex items-center justify-between gap-4">
        <span className="flex items-center gap-2 text-xl font-medium">
          {row.isCorrect && <span aria-hidden>✓</span>}
          {row.label}
        </span>
        <span className="text-lg text-slate-300 tabular-nums">
          {row.count}
          <span className="ml-2 text-sm">({share}%)</span>
        </span>
      </div>
    </div>
  );
}

// Baut Bar-Rows: für MC alle Optionen, für T/F beide, für fill_blank
// Top-Antworten. Markiert richtige Antworten via Block-Schema.
function buildBarRows(block: Block, distribution: { key: string; count: number }[]): BarRow[] {
  const countMap = new Map(distribution.map((d) => [d.key, d.count]));
  if (block.type === 'multiple_choice') {
    const correctIds = block.options
      .filter((o) => o.correct)
      .map((o) => o.id)
      .sort();
    const correctKey = JSON.stringify(correctIds);
    return block.options.map((o) => {
      const key = JSON.stringify([o.id]);
      return {
        label: o.text,
        count: countMap.get(key) ?? 0,
        isCorrect: correctKey === key,
      };
    });
  }
  if (block.type === 'true_false') {
    return [
      { label: '✓ Wahr', count: countMap.get('true') ?? 0, isCorrect: block.answer === true },
      { label: '✗ Falsch', count: countMap.get('false') ?? 0, isCorrect: block.answer === false },
    ];
  }
  if (block.type === 'fill_blank') {
    const correctSolutions = block.solutions.map((s) => s.trim().toLowerCase());
    return distribution.slice(0, 6).map((d) => ({
      label: d.key || '(leer)',
      count: d.count,
      isCorrect: correctSolutions.includes(d.key),
    }));
  }
  return [];
}

function questionText(block: Block): string {
  if ('question' in block && typeof block.question === 'string') return block.question;
  if (block.type === 'fill_blank') return block.text;
  return 'Frage';
}
