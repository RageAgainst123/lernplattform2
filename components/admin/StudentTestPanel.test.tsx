import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { StudentTestPanel } from './StudentTestPanel';
import type { Block } from '@/lib/schemas/blocks';

// „Als Schüler:in testen"-Tab: bildet die echte Schüler-Sicht nach, ohne DB/
// Routing. Worksheet → alle Blöcke + „Abgeben"; Quiz → Block-für-Block; beide
// enden in einer simulierten Score-Auswertung mit Neu-starten.

const BLOCKS: Block[] = [
  { id: 'b1', type: 'text', content: 'Theorie.' },
  {
    id: 'b2',
    type: 'true_false',
    question: 'Stimmt das?',
    answer: true,
  },
];

describe('StudentTestPanel — Worksheet', () => {
  it('rendert alle Blöcke auf einer Seite + Abgeben-Knopf', () => {
    render(<StudentTestPanel blocks={BLOCKS} displayMode="worksheet" />);
    expect(screen.getByText('Theorie.')).toBeInTheDocument();
    expect(screen.getByText('Stimmt das?')).toBeInTheDocument();
    expect(screen.getByTestId('test-worksheet-submit')).toBeInTheDocument();
  });

  it('zeigt nach Abgeben eine simulierte Score-Auswertung + reset', () => {
    render(<StudentTestPanel blocks={BLOCKS} displayMode="worksheet" />);
    // richtige Antwort wählen → Wahr
    fireEvent.click(screen.getByRole('button', { name: /Wahr/ }));
    fireEvent.click(screen.getByTestId('test-worksheet-submit'));
    expect(screen.getByTestId('test-result')).toBeInTheDocument();
    // 1 von 1 bewertbarem Block richtig → 100 %
    expect(screen.getByTestId('test-result-percent')).toHaveTextContent('100%');
    // Neu starten → zurück zum Test
    fireEvent.click(screen.getByTestId('test-reset'));
    expect(screen.getByTestId('test-worksheet-submit')).toBeInTheDocument();
  });
});

describe('StudentTestPanel — Quiz', () => {
  it('rendert Block-für-Block mit Prüfen', () => {
    render(<StudentTestPanel blocks={BLOCKS} displayMode="quiz" />);
    expect(screen.getByTestId('test-quiz')).toBeInTheDocument();
    // erster Block (text) ist nicht graded → direkt „Weiter"
    expect(screen.getByTestId('test-quiz-next')).toBeInTheDocument();
  });

  it('spielt bis zum Ende durch und zeigt das Ergebnis', () => {
    render(<StudentTestPanel blocks={BLOCKS} displayMode="quiz" />);
    fireEvent.click(screen.getByTestId('test-quiz-next')); // text → b2
    fireEvent.click(screen.getByRole('button', { name: /Wahr/ })); // Antwort
    fireEvent.click(screen.getByTestId('test-quiz-check')); // Prüfen
    fireEvent.click(screen.getByTestId('test-quiz-next')); // Fertig
    expect(screen.getByTestId('test-result')).toBeInTheDocument();
    expect(screen.getByTestId('test-result-percent')).toHaveTextContent('100%');
  });
});

describe('StudentTestPanel — leeres Modul', () => {
  it('zeigt einen Hinweis statt Test', () => {
    render(<StudentTestPanel blocks={[]} displayMode="worksheet" />);
    expect(screen.getByText(/Füge Blöcke hinzu/)).toBeInTheDocument();
  });
});
