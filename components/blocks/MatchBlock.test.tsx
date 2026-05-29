import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MatchBlock } from './MatchBlock';
import type { MatchBlock as MatchBlockType } from '@/lib/schemas/blocks';

const BLOCK: MatchBlockType = {
  id: 'm1',
  type: 'match',
  question: 'Ordne richtig zu.',
  pairs: [
    { id: 'p1', term: 'Tastatur', category: 'Eingabe' },
    { id: 'p2', term: 'Drucker', category: 'Ausgabe' },
    { id: 'p3', term: 'Maus', category: 'Eingabe' },
  ],
};

describe('MatchBlock', () => {
  it('renders question and all unassigned terms initially', () => {
    render(<MatchBlock block={BLOCK} assignment={{}} checked={false} onAssign={vi.fn()} />);
    expect(screen.getByText(BLOCK.question!)).toBeInTheDocument();
    expect(screen.getByText('Tastatur')).toBeInTheDocument();
    expect(screen.getByText('Drucker')).toBeInTheDocument();
    expect(screen.getByText('Maus')).toBeInTheDocument();
  });

  it('renders both unique categories', () => {
    render(<MatchBlock block={BLOCK} assignment={{}} checked={false} onAssign={vi.fn()} />);
    // Kategorien werden aus den pairs abgeleitet (Set) — Eingabe + Ausgabe
    expect(screen.getAllByText('Eingabe').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ausgabe').length).toBeGreaterThan(0);
  });

  it('moves assigned terms out of the pool', () => {
    render(
      <MatchBlock block={BLOCK} assignment={{ p1: 'Eingabe' }} checked={false} onAssign={vi.fn()} />
    );
    // Tastatur (p1) ist zugewiesen → erscheint im Kategorie-Block, nicht mehr im Pool.
    // Pool zeigt nur die nicht-zugewiesenen → Drucker + Maus.
    // Da „Tastatur" exakt einmal vorkommt (in der Kategorie), prüfen wir das:
    const tastaturNodes = screen.getAllByText('Tastatur');
    expect(tastaturNodes).toHaveLength(1);
  });
});
