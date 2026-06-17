import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CrosswordBlock } from './CrosswordBlock';
import type { CrosswordBlock as CrosswordBlockType } from '@/lib/schemas/blocks';

// Kreuzworträtsel: MAUS (waagrecht) + MONITOR (senkrecht) teilen das M bei
// (0,0) → 10 füllbare Zellen, beide Wörter Nummer 1 (gleiche Startzelle).
// Zellen sind <input aria-label="Zelle r,c"> (1-basiert).

const BLOCK: CrosswordBlockType = {
  id: 'cw1',
  type: 'crossword',
  instruction: 'Fülle das Kreuzworträtsel aus.',
  rows: 7,
  cols: 5,
  words: [
    {
      id: 'w1',
      answer: 'MAUS',
      clue: 'Eingabegerät zum Klicken',
      direction: 'across',
      row: 0,
      col: 0,
    },
    { id: 'w2', answer: 'MONITOR', clue: 'Zeigt das Bild an', direction: 'down', row: 0, col: 0 },
  ],
};

describe('CrosswordBlock', () => {
  it('rendert Instruktion, Gitter-Zellen + Fragen mit Nummer und Länge', () => {
    render(<CrosswordBlock block={BLOCK} answer={{}} checked={false} onAnswer={vi.fn()} />);
    expect(screen.getByText('Fülle das Kreuzworträtsel aus.')).toBeInTheDocument();
    // 10 füllbare Zellen (4 + 7 − geteiltes M).
    expect(screen.getAllByRole('textbox')).toHaveLength(10);
    expect(screen.getByText(/Eingabegerät zum Klicken/)).toBeInTheDocument();
    expect(screen.getByText(/Zeigt das Bild an/)).toBeInTheDocument();
    expect(screen.getByText(/\(7\)/)).toBeInTheDocument(); // Wortlänge MONITOR
  });

  it('Buchstabe tippen schreibt die Zelle (uppercase) in die Antwort', () => {
    const onAnswer = vi.fn();
    render(<CrosswordBlock block={BLOCK} answer={{}} checked={false} onAnswer={onAnswer} />);
    const cell = screen.getByRole('textbox', { name: 'Zelle 1,1' });
    fireEvent.click(cell);
    fireEvent.change(cell, { target: { value: 'm' } });
    expect(onAnswer).toHaveBeenCalledWith({ '0,0': 'M' });
  });

  it('zeigt nach dem Prüfen grün/rot pro Zelle + den Zellen-Zähler', () => {
    render(
      <CrosswordBlock
        block={BLOCK}
        answer={{ '0,0': 'M', '0,1': 'X' }}
        checked
        onAnswer={vi.fn()}
      />
    );
    expect(screen.getByRole('textbox', { name: 'Zelle 1,1' }).className).toContain('green');
    expect(screen.getByRole('textbox', { name: 'Zelle 1,2' }).className).toContain('red');
    expect(screen.getByText('1 von 10 Zellen richtig')).toBeInTheDocument();
    // Gesperrt: Inputs disabled.
    expect(screen.getByRole('textbox', { name: 'Zelle 1,1' })).toBeDisabled();
  });

  it('sperrt Eingaben im readOnly-Modus', () => {
    render(
      <CrosswordBlock block={BLOCK} answer={{}} checked={false} readOnly onAnswer={vi.fn()} />
    );
    expect(screen.getByRole('textbox', { name: 'Zelle 1,1' })).toBeDisabled();
  });
});
