import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryBlock } from './MemoryBlock';
import type { MemoryBlock as MemoryBlockType } from '@/lib/schemas/blocks';

// Memory / Paare-Spiel. useShuffled wird auf Identität gemockt, damit die
// Karten deterministisch in Eingabe-Reihenfolge liegen: p1:a, p1:b, p2:a,
// p2:b, … (der echte Hook mischt beim Mount via Math.random).
vi.mock('./useShuffled', () => ({
  useShuffled: <T,>(items: T[]): T[] => items,
}));

const BLOCK: MemoryBlockType = {
  id: 'mem1',
  type: 'memory',
  instruction: 'Finde die passenden Paare.',
  pairs: [
    { id: 'p1', a: { text: 'Maus' }, b: { text: 'Eingabegerät' } },
    { id: 'p2', a: { text: 'Bildschirm' }, b: { text: 'Ausgabegerät' } },
    { id: 'p3', a: { text: 'CPU' }, b: { text: 'Rechenwerk' } },
  ],
};

describe('MemoryBlock', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('rendert Instruktion + alle Karten zugedeckt + Zählerstand', () => {
    render(<MemoryBlock block={BLOCK} answer={[]} checked={false} onAnswer={vi.fn()} />);
    expect(screen.getByText('Finde die passenden Paare.')).toBeInTheDocument();
    expect(screen.getByText('0 von 3 Paaren gefunden')).toBeInTheDocument();
    // Zugedeckt → Texte nicht sichtbar.
    expect(screen.queryByText('Maus')).not.toBeInTheDocument();
  });

  it('passende Karten bleiben offen + melden den Treffer', () => {
    const onAnswer = vi.fn();
    render(<MemoryBlock block={BLOCK} answer={[]} checked={false} onAnswer={onAnswer} />);
    const cards = screen.getAllByRole('button');
    fireEvent.click(cards[0]!); // p1:a (Maus)
    fireEvent.click(cards[1]!); // p1:b (Eingabegerät) → Treffer
    expect(onAnswer).toHaveBeenCalledWith(['p1']);
  });

  it('nicht passende Karten klappen nach dem Timer zurück', () => {
    const onAnswer = vi.fn();
    render(<MemoryBlock block={BLOCK} answer={[]} checked={false} onAnswer={onAnswer} />);
    const cards = screen.getAllByRole('button');
    fireEvent.click(cards[0]!); // p1:a (Maus)
    fireEvent.click(cards[2]!); // p2:a (Bildschirm) → kein Treffer
    expect(screen.getByText('Maus')).toBeInTheDocument(); // kurz offen
    act(() => vi.advanceTimersByTime(800));
    expect(onAnswer).not.toHaveBeenCalled();
    expect(screen.queryByText('Maus')).not.toBeInTheDocument(); // wieder zu
  });

  it('zeigt im gesperrten Modus alle Karten + markiert gefundene Paare', () => {
    render(<MemoryBlock block={BLOCK} answer={['p1']} checked readOnly onAnswer={vi.fn()} />);
    // Alle Karten offen.
    expect(screen.getByText('Maus')).toBeInTheDocument();
    expect(screen.getByText('CPU')).toBeInTheDocument();
    expect(screen.getByText('1 von 3 Paaren gefunden')).toBeInTheDocument();
  });
});
