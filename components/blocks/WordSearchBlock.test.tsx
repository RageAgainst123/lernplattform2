import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WordSearchBlock } from './WordSearchBlock';
import type { WordSearchBlock as WordSearchBlockType } from '@/lib/schemas/blocks';

// Wortsuchrätsel: Tap Start + Tap Ende markiert ein Wort. Buchstaben sind
// deterministisch (Lösungszellen + seeded Füllbuchstaben) — kein Mock nötig.

const block: WordSearchBlockType = {
  id: 'wsr1',
  type: 'word_search',
  instruction: 'Finde alle Wörter.',
  rows: 8,
  cols: 8,
  words: [
    { id: 'w1', word: 'MAUS', direction: 'across', row: 0, col: 0 },
    { id: 'w2', word: 'MONITOR', direction: 'down', row: 0, col: 0 },
    { id: 'w3', word: 'TABLET', direction: 'diag', row: 1, col: 1 },
  ],
};

function gridButtons() {
  return screen.getAllByRole('button');
}

describe('WordSearchBlock', () => {
  it('rendert das volle Gitter + Wortliste', () => {
    render(<WordSearchBlock block={block} answer={[]} checked={false} onAnswer={vi.fn()} />);
    expect(gridButtons()).toHaveLength(64);
    expect(screen.getByText('MAUS')).toBeInTheDocument();
    expect(screen.getByText(/0 von 3 Wörtern gefunden/)).toBeInTheDocument();
  });

  it('Tap auf Start + Ende eines Worts meldet onAnswer mit der wordId', () => {
    const onAnswer = vi.fn();
    render(<WordSearchBlock block={block} answer={[]} checked={false} onAnswer={onAnswer} />);
    const cells = gridButtons();
    // MAUS liegt in Zeile 0: Zellen-Index 0 (0,0) bis 3 (0,3).
    fireEvent.click(cells[0]!);
    fireEvent.click(cells[3]!);
    expect(onAnswer).toHaveBeenCalledWith(['w1']);
  });

  it('schiefe Auswahl meldet nichts', () => {
    const onAnswer = vi.fn();
    render(<WordSearchBlock block={block} answer={[]} checked={false} onAnswer={onAnswer} />);
    const cells = gridButtons();
    fireEvent.click(cells[0]!); // (0,0)
    fireEvent.click(cells[8 + 2]!); // (1,2) — keine Linie zu (0,0) mit Wort
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it('gefundene Wörter sind durchgestrichen, gesperrt bei checked', () => {
    render(<WordSearchBlock block={block} answer={['w1']} checked={true} onAnswer={vi.fn()} />);
    expect(screen.getByText('MAUS').className).toContain('line-through');
    expect(screen.getByText(/1 von 3 Wörtern gefunden/)).toBeInTheDocument();
    for (const btn of gridButtons()) expect(btn).toBeDisabled();
  });
});
