import { CheckCircle2Icon, XCircleIcon, InfoIcon } from 'lucide-react';
import { percentScore } from '@/lib/blocks/evaluate';

// Bewertungs-Kopf der Abgabe-Detailseite: Score (N/M), Prozent und Bestehens-
// Status. Vier Fälle:
//   - noch nicht begonnen → neutraler Hinweis
//   - keine bewertbaren Blöcke (maxScore 0/null) → neutraler Hinweis, NIE „0 %"
//   - bewertbare Blöcke, keine Schwelle → nur „N/M richtig (X %)"
//   - Schwelle gesetzt → Bestanden/Nicht bestanden (grün/rot)

type Props = {
  score: number;
  maxScore: number | null;
  passThreshold: number | null;
  hasProgress: boolean;
};

type Variant = { tone: string; icon: React.ReactNode; text: string };

const INFO = <InfoIcon className="size-4" aria-hidden />;

// Reine Entscheidung über Ton/Icon/Text — hält die Komponente klein + testbar.
function buildVariant({ score, maxScore, passThreshold, hasProgress }: Props): Variant {
  if (!hasProgress) {
    return {
      tone: 'text-muted-foreground border-dashed',
      icon: INFO,
      text: 'Diese:r Schüler:in hat das Modul noch nicht begonnen.',
    };
  }
  const max = maxScore ?? 0;
  const pct = percentScore(score, max);
  if (pct === null) {
    return {
      tone: 'text-muted-foreground bg-muted/40',
      icon: INFO,
      text: 'Keine automatisch bewertbaren Aufgaben — bitte ganzheitlich beurteilen.',
    };
  }
  const label = `${score}/${max} richtig (${pct} %)`;
  if (passThreshold === null) {
    return { tone: 'bg-muted/40', icon: INFO, text: label };
  }
  if (pct >= passThreshold) {
    return {
      tone: 'border-green-300 bg-green-50 text-green-800',
      icon: <CheckCircle2Icon className="size-4" aria-hidden />,
      text: `Bestanden — ${label} (≥ ${passThreshold} %)`,
    };
  }
  return {
    tone: 'border-red-300 bg-red-50 text-red-800',
    icon: <XCircleIcon className="size-4" aria-hidden />,
    text: `Nicht bestanden — ${label} (< ${passThreshold} %)`,
  };
}

export function SubmissionScoreHeader(props: Props) {
  const v = buildVariant(props);
  return (
    <div className={`flex items-center gap-2 rounded-md border p-3 text-sm font-medium ${v.tone}`}>
      {v.icon}
      {v.text}
    </div>
  );
}
