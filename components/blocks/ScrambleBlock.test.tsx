import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScrambleBlock } from './ScrambleBlock';
import { scrambledLetters } from '@/lib/blocks/scramble';
import type { ScrambleBlock as ScrambleBlockType } from '@/lib/schemas/blocks';

// Buchstabensalat: Tiles antippen baut das Wort; Reihenfolge der Tiles ist
// deterministisch (seeded) — der Test kann sie über scrambledLetters vorhersagen.

const block: ScrambleBlockType = {
  id: 'sal1',
  type: 'scramble',
  instruction: 'Setze die Wörter zusammen.',
  words: [{ id: 'w1', word: 'MAUS', hint: 'Eingabegerät' }],
};

describe('ScrambleBlock', () => {
  it('rendert Hinweis + gemischte Tiles (nie in Original-Reihenfolge)', () => {
    render(<ScrambleBlock block={block} answer={{}} checked={false} onAnswer={vi.fn()} />);
    expect(screen.getByText(/Eingabegerät/)).toBeInTheDocument();
    const tiles = scrambledLetters('MAUS', 'sal1:w1');
    expect(tiles.join('')).not.toBe('MAUS');
    expect(screen.getByText(/0 von 1 Wörtern richtig/)).toBeInTheDocument();
  });

  it('Tiles in Lösungs-Reihenfolge antippen → onAnswer mit komplettem Wort', () => {
    const onAnswer = vi.fn();
    render(<ScrambleBlock block={block} answer={{}} checked={false} onAnswer={onAnswer} />);
    // Tippe für jeden Lösungs-Buchstaben den nächsten freien (nicht-disabled)
    // Tile-Button mit diesem Label an — angetippte Tiles werden disabled.
    for (const target of [...'MAUS']) {
      const candidates = screen
        .getAllByRole('button', { name: target })
        .filter((b) => !(b as HTMLButtonElement).disabled);
      fireEvent.click(candidates[0]!);
    }
    expect(onAnswer).toHaveBeenLastCalledWith({ w1: 'MAUS' });
  });

  it('checked: richtiges Wort zählt, gesperrt', () => {
    render(
      <ScrambleBlock block={block} answer={{ w1: 'MAUS' }} checked={true} onAnswer={vi.fn()} />
    );
    expect(screen.getByText(/1 von 1 Wörtern richtig/)).toBeInTheDocument();
    for (const btn of screen.getAllByRole('button')) expect(btn).toBeDisabled();
  });

  it('checked: falsches Wort zeigt die Lösung', () => {
    render(
      <ScrambleBlock block={block} answer={{ w1: 'MASU' }} checked={true} onAnswer={vi.fn()} />
    );
    expect(screen.getByText(/Richtig wäre: MAUS/)).toBeInTheDocument();
  });
});
