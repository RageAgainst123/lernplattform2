import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MarkWordsBlock } from './MarkWordsBlock';
import type { MarkWordsBlock as MarkWordsBlockType } from '@/lib/schemas/blocks';

const BLOCK: MarkWordsBlockType = {
  id: 'mw1',
  type: 'mark_words',
  instruction: 'Markiere alle persönlichen Daten.',
  text: 'Anna wohnt in Wien',
  correctIndices: [0, 3],
};

describe('MarkWordsBlock', () => {
  it('rendert Instruktion + jedes Wort als Button', () => {
    render(<MarkWordsBlock block={BLOCK} answer={[]} checked={false} onMark={vi.fn()} />);
    expect(screen.getByText('Markiere alle persönlichen Daten.')).toBeInTheDocument();
    for (const w of ['Anna', 'wohnt', 'in', 'Wien']) {
      expect(screen.getByRole('button', { name: w })).toBeInTheDocument();
    }
  });

  it('markiert ein Wort per Klick (fügt seinen wordIndex hinzu)', () => {
    const onMark = vi.fn();
    render(<MarkWordsBlock block={BLOCK} answer={[]} checked={false} onMark={onMark} />);
    fireEvent.click(screen.getByRole('button', { name: 'Anna' }));
    expect(onMark).toHaveBeenCalledWith([0]);
  });

  it('entfernt eine bestehende Markierung beim erneuten Klick', () => {
    const onMark = vi.fn();
    render(<MarkWordsBlock block={BLOCK} answer={[0, 3]} checked={false} onMark={onMark} />);
    fireEvent.click(screen.getByRole('button', { name: 'Anna' }));
    expect(onMark).toHaveBeenCalledWith([3]);
  });

  it('hält die markierten Indizes aufsteigend sortiert', () => {
    const onMark = vi.fn();
    render(<MarkWordsBlock block={BLOCK} answer={[3]} checked={false} onMark={onMark} />);
    fireEvent.click(screen.getByRole('button', { name: 'Anna' }));
    expect(onMark).toHaveBeenCalledWith([0, 3]);
  });

  it('ist im readOnly-Modus gesperrt (kein onMark)', () => {
    const onMark = vi.fn();
    render(<MarkWordsBlock block={BLOCK} answer={[0]} checked={false} readOnly onMark={onMark} />);
    fireEvent.click(screen.getByRole('button', { name: 'wohnt' }));
    expect(onMark).not.toHaveBeenCalled();
  });
});
