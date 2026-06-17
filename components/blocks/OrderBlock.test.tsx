import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { OrderBlock } from './OrderBlock';
import type { OrderBlock as OrderBlockType } from '@/lib/schemas/blocks';

const BLOCK: OrderBlockType = {
  id: 'ord1',
  type: 'order',
  instruction: 'Bring in die richtige Reihenfolge.',
  items: [
    { id: 'a', text: 'Erstens' },
    { id: 'b', text: 'Zweitens' },
    { id: 'c', text: 'Drittens' },
  ],
};

describe('OrderBlock', () => {
  it('rendert Instruktion + alle Items (initial im Pool)', () => {
    render(<OrderBlock block={BLOCK} answer={[]} checked={false} onReorder={vi.fn()} />);
    expect(screen.getByText('Bring in die richtige Reihenfolge.')).toBeInTheDocument();
    for (const t of ['Erstens', 'Zweitens', 'Drittens']) {
      expect(screen.getByText((c) => c.includes(t))).toBeInTheDocument();
    }
  });

  it('hängt einen angetippten Begriff ans Ende der Reihenfolge', () => {
    const onReorder = vi.fn();
    render(<OrderBlock block={BLOCK} answer={['a']} checked={false} onReorder={onReorder} />);
    // Pool enthält b + c; klick auf b → ['a','b'].
    fireEvent.click(screen.getByRole('button', { name: /Zweitens/ }));
    expect(onReorder).toHaveBeenCalledWith(['a', 'b']);
  });

  it('verschiebt ein Item per ▼ nach unten', () => {
    const onReorder = vi.fn();
    render(<OrderBlock block={BLOCK} answer={['a', 'b']} checked={false} onReorder={onReorder} />);
    // erstes Item (a) eine Position runter → ['b','a'].
    fireEvent.click(screen.getAllByRole('button', { name: 'nach unten' })[0]!);
    expect(onReorder).toHaveBeenCalledWith(['b', 'a']);
  });

  it('legt ein Item per × zurück', () => {
    const onReorder = vi.fn();
    render(<OrderBlock block={BLOCK} answer={['a', 'b']} checked={false} onReorder={onReorder} />);
    fireEvent.click(screen.getByRole('button', { name: /Erstens zurücklegen/ }));
    expect(onReorder).toHaveBeenCalledWith(['b']);
  });

  it('zeigt im readOnly-Modus keine Steuer-Knöpfe', () => {
    render(
      <OrderBlock
        block={BLOCK}
        answer={['a', 'b', 'c']}
        checked={false}
        readOnly
        onReorder={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: 'nach unten' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /zurücklegen/ })).not.toBeInTheDocument();
  });
});
