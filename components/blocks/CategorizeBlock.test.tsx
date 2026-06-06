import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategorizeBlock } from './CategorizeBlock';
import type { CategorizeBlock as CategorizeBlockType } from '@/lib/schemas/blocks';

const BLOCK: CategorizeBlockType = {
  id: 'cat1',
  type: 'categorize',
  question: 'Sortiere die Geräte ein.',
  buckets: [
    { id: 'b-ein', label: 'Eingabe' },
    { id: 'b-aus', label: 'Ausgabe' },
  ],
  items: [
    { id: 'i1', text: 'Tastatur', bucketId: 'b-ein' },
    { id: 'i2', text: 'Drucker', bucketId: 'b-aus' },
    { id: 'i3', text: 'Maus', bucketId: 'b-ein' },
  ],
};

describe('CategorizeBlock', () => {
  it('rendert Frage + alle Items initial im Pool', () => {
    render(<CategorizeBlock block={BLOCK} answer={{}} checked={false} onAssign={vi.fn()} />);
    expect(screen.getByText('Sortiere die Geräte ein.')).toBeInTheDocument();
    expect(screen.getByText('Tastatur')).toBeInTheDocument();
    expect(screen.getByText('Drucker')).toBeInTheDocument();
    expect(screen.getByText('Maus')).toBeInTheDocument();
  });

  it('rendert beide Behälter mit Label', () => {
    render(<CategorizeBlock block={BLOCK} answer={{}} checked={false} onAssign={vi.fn()} />);
    expect(screen.getByText('Eingabe')).toBeInTheDocument();
    expect(screen.getByText('Ausgabe')).toBeInTheDocument();
  });

  it('verschiebt einsortierte Items aus dem Pool in den Behälter', () => {
    render(
      <CategorizeBlock block={BLOCK} answer={{ i1: 'b-ein' }} checked={false} onAssign={vi.fn()} />
    );
    // Tastatur (i1) ist einsortiert → erscheint genau einmal (im Behälter).
    expect(screen.getAllByText('Tastatur')).toHaveLength(1);
  });

  it('zeigt „Alle Begriffe einsortiert" wenn der Pool leer ist', () => {
    render(
      <CategorizeBlock
        block={BLOCK}
        answer={{ i1: 'b-ein', i2: 'b-aus', i3: 'b-ein' }}
        checked={false}
        onAssign={vi.fn()}
      />
    );
    expect(screen.getByText(/Alle Begriffe einsortiert/i)).toBeInTheDocument();
  });
});
