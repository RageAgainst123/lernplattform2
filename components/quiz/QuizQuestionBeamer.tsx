import type { QuizBeamerQuestionState } from '@/lib/db/quiz-beamer-state';
import type { Block } from '@/lib/schemas/blocks';

// Beamer-Frage-Renderer (Phase S2.C). Vollbild, große Schrift, Kahoot-
// inspirierte Farb-Optionen für MC. Wird während der active-Phase
// gerendert — das Reveal-Diagramm kommt in QuizRevealBeamer.tsx.
//
// Antwort-Counter "N/M haben geantwortet" + Countdown-Ring (CSS-only
// für jetzt — animierter Ring kommt in Politur, falls nötig).

const OPTION_STYLES = [
  { bg: 'bg-rose-500', symbol: '▲', text: 'text-white' },
  { bg: 'bg-blue-500', symbol: '◆', text: 'text-white' },
  { bg: 'bg-amber-400', symbol: '●', text: 'text-amber-950' },
  { bg: 'bg-emerald-500', symbol: '■', text: 'text-white' },
  { bg: 'bg-purple-500', symbol: '▼', text: 'text-white' },
  { bg: 'bg-cyan-500', symbol: '★', text: 'text-white' },
] as const;

type Props = {
  state: QuizBeamerQuestionState;
};

export function QuizQuestionBeamer({ state }: Props) {
  const { block, remainingSeconds, answered, total } = state;
  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-white">
      <QuestionHeader
        remainingSeconds={remainingSeconds}
        answered={answered}
        total={total}
        questionIndex={state.questionIndex}
      />
      <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8 text-center">
        <h1 className="max-w-5xl text-5xl leading-tight font-bold md:text-6xl">
          {questionText(block)}
        </h1>
        <QuestionOptions block={block} />
      </main>
    </div>
  );
}

function QuestionHeader({
  remainingSeconds,
  answered,
  total,
  questionIndex,
}: {
  remainingSeconds: number;
  answered: number;
  total: number;
  questionIndex: number;
}) {
  return (
    <header className="flex items-center justify-between border-b border-slate-700 px-8 py-4">
      <p className="text-sm font-medium tracking-wide text-slate-400 uppercase">
        Frage {questionIndex + 1}
      </p>
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold tabular-nums ring-4 ${
          remainingSeconds <= 5 ? 'bg-rose-600 ring-rose-300' : 'bg-slate-700 ring-slate-500'
        }`}
      >
        {remainingSeconds}
      </div>
      <p className="text-2xl font-semibold tabular-nums">
        {answered}/{total} <span className="text-sm font-normal text-slate-400">geantwortet</span>
      </p>
    </header>
  );
}

function QuestionOptions({ block }: { block: Block }) {
  if (block.type === 'multiple_choice') {
    return (
      <div className="grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
        {block.options.map((opt, i) => {
          const style = OPTION_STYLES[i % OPTION_STYLES.length];
          return (
            <div
              key={opt.id}
              className={`flex items-center gap-4 rounded-2xl ${style.bg} ${style.text} px-6 py-8 text-2xl font-semibold shadow-lg`}
            >
              <span aria-hidden className="text-4xl">
                {style.symbol}
              </span>
              <span className="flex-1 text-left">{opt.text}</span>
            </div>
          );
        })}
      </div>
    );
  }
  if (block.type === 'true_false') {
    return (
      <div className="grid w-full max-w-3xl grid-cols-2 gap-4">
        <div className="rounded-2xl bg-emerald-500 px-6 py-12 text-3xl font-semibold text-white shadow-lg">
          ✓ Wahr
        </div>
        <div className="rounded-2xl bg-rose-500 px-6 py-12 text-3xl font-semibold text-white shadow-lg">
          ✗ Falsch
        </div>
      </div>
    );
  }
  if (block.type === 'fill_blank') {
    return (
      <p className="rounded-2xl bg-slate-800 px-8 py-6 text-2xl text-slate-200">
        💬 Tipp deine Antwort am eigenen Gerät ein.
      </p>
    );
  }
  return null;
}

function questionText(block: Block): string {
  if ('question' in block && typeof block.question === 'string') return block.question;
  if (block.type === 'fill_blank') return block.text;
  return 'Frage';
}
