import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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

  it('sortiert per Ein-Klick-Knopf in den gewählten Behälter ein', () => {
    const onAssign = vi.fn();
    render(<CategorizeBlock block={BLOCK} answer={{}} checked={false} onAssign={onAssign} />);
    // Jeder Pool-Begriff hat einen Knopf pro Behälter — „→ Eingabe" gibt es 3×.
    const buttons = screen.getAllByRole('button', { name: '→ Eingabe' });
    expect(buttons).toHaveLength(3);
    fireEvent.click(buttons[0]); // Tastatur → Eingabe
    expect(onAssign).toHaveBeenCalledWith({ i1: 'b-ein' });
  });

  it('legt ein einsortiertes Item per „↩"-Knopf zurück', () => {
    const onAssign = vi.fn();
    render(
      <CategorizeBlock block={BLOCK} answer={{ i1: 'b-ein' }} checked={false} onAssign={onAssign} />
    );
    fireEvent.click(screen.getByRole('button', { name: /Tastatur zurücklegen/i }));
    expect(onAssign).toHaveBeenCalledWith({});
  });

  it('zeigt im read-only-Modus keine Einsortier-Knöpfe', () => {
    render(
      <CategorizeBlock
        block={BLOCK}
        answer={{ i1: 'b-ein' }}
        checked={false}
        readOnly
        onAssign={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: '→ Eingabe' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /zurücklegen/i })).not.toBeInTheDocument();
  });
});
