import type { LivePollBlock as LivePollBlockType } from '@/lib/schemas/blocks';

// Beamer-Darstellung einer Live-Abstimmung: große Frage + die Antwortoptionen
// als Karten (A, B, C …). Die eigentliche Abstimmung passiert auf den
// Schüler:innen-Geräten (LiveOverlay); der wachsende Ergebnisbalken wird vom
// Beamer-Controller (Stufe 3) über diese Optionen gelegt.
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function LivePollBlock({ block }: { block: LivePollBlockType }) {
  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-8">
      <h2 className="text-center text-4xl font-bold tracking-tight sm:text-5xl">
        {block.question}
      </h2>
      <ul className="flex w-full flex-col gap-3">
        {block.options.map((opt, i) => (
          <li
            key={opt.id}
            className="bg-muted flex items-center gap-4 rounded-lg px-6 py-4 text-2xl"
          >
            <span className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-md font-bold">
              {LETTERS[i] ?? i + 1}
            </span>
            <span>{opt.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
