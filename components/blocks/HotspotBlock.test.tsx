import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { HotspotBlock } from './HotspotBlock';
import type { HotspotBlock as HotspotBlockType } from '@/lib/schemas/blocks';

const BLOCK: HotspotBlockType = {
  id: 'hs1',
  type: 'hotspot',
  instruction: 'Tippe alle Eingabegeräte an.',
  imageUrl: 'https://example.com/bild.jpg',
  imageAlt: 'Ein Schreibtisch',
  areas: [
    {
      id: 'z1',
      label: 'Tastatur',
      x: 0.2,
      y: 0.5,
      shape: 'circle',
      r: 0.1,
      rotation: 0,
      isCorrect: true,
    },
    {
      id: 'z2',
      label: 'Maus',
      x: 0.5,
      y: 0.5,
      shape: 'circle',
      r: 0.1,
      rotation: 0,
      isCorrect: true,
    },
    {
      id: 'z3',
      label: 'Monitor',
      x: 0.8,
      y: 0.3,
      shape: 'circle',
      r: 0.1,
      rotation: 0,
      isCorrect: false,
    },
  ],
};

describe('HotspotBlock', () => {
  it('rendert Instruktion + eine klickbare Zone pro Area', () => {
    render(<HotspotBlock block={BLOCK} answer={[]} checked={false} onSelect={vi.fn()} />);
    expect(screen.getByText('Tippe alle Eingabegeräte an.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tastatur' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Maus' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Monitor' })).toBeInTheDocument();
  });

  it('fügt eine angetippte Zone zur Antwort hinzu', () => {
    const onSelect = vi.fn();
    render(<HotspotBlock block={BLOCK} answer={[]} checked={false} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tastatur' }));
    expect(onSelect).toHaveBeenCalledWith(['z1']);
  });

  it('entfernt eine bereits angetippte Zone (Toggle)', () => {
    const onSelect = vi.fn();
    render(<HotspotBlock block={BLOCK} answer={['z1']} checked={false} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tastatur' }));
    expect(onSelect).toHaveBeenCalledWith([]);
  });

  it('markiert angetippte Zonen via aria-pressed', () => {
    render(<HotspotBlock block={BLOCK} answer={['z2']} checked={false} onSelect={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Maus' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Tastatur' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('sperrt Klicks im checked-Modus', () => {
    const onSelect = vi.fn();
    render(<HotspotBlock block={BLOCK} answer={['z1']} checked onSelect={onSelect} />);
    const btn = screen.getByRole('button', { name: 'Tastatur' });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('sperrt Klicks im readOnly-Modus', () => {
    const onSelect = vi.fn();
    render(<HotspotBlock block={BLOCK} answer={[]} checked={false} readOnly onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'Maus' }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('nutzt einen Fallback-Namen, wenn kein Label gesetzt ist', () => {
    const block: HotspotBlockType = {
      ...BLOCK,
      areas: [{ id: 'z1', x: 0.5, y: 0.5, shape: 'circle', r: 0.1, rotation: 0, isCorrect: true }],
    };
    render(<HotspotBlock block={block} answer={[]} checked={false} onSelect={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Bereich 1' })).toBeInTheDocument();
  });
});

const GROUP_BLOCK: HotspotBlockType = {
  id: 'hsg1',
  type: 'hotspot',
  instruction: 'Schritt für Schritt.',
  imageUrl: 'https://example.com/bild.jpg',
  groups: [
    { id: 'gA', label: 'Eingabegeräte' },
    { id: 'gB', label: 'Ausgabegeräte' },
  ],
  areas: [
    {
      id: 'a1',
      label: 'Tastatur',
      x: 0.2,
      y: 0.5,
      shape: 'circle',
      r: 0.1,
      rotation: 0,
      isCorrect: true,
      groupId: 'gA',
    },
    {
      id: 'b1',
      label: 'Monitor',
      x: 0.6,
      y: 0.5,
      shape: 'circle',
      r: 0.1,
      rotation: 0,
      isCorrect: true,
      groupId: 'gB',
    },
  ],
};

describe('HotspotBlock — Gruppen-Modus', () => {
  it('zeigt im ersten Schritt nur Zonen der ersten Gruppe + deren Frage', () => {
    render(<HotspotBlock block={GROUP_BLOCK} answer={[]} checked={false} onSelect={vi.fn()} />);
    expect(screen.getByText(/Tippe alle Eingabegeräte an/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tastatur' })).toBeInTheDocument();
    // Zone der zweiten Gruppe ist im ersten Schritt nicht sichtbar.
    expect(screen.queryByRole('button', { name: 'Monitor' })).not.toBeInTheDocument();
  });

  it('Prüfen → Weiter wechselt zur zweiten Gruppe', () => {
    render(<HotspotBlock block={GROUP_BLOCK} answer={['a1']} checked={false} onSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Prüfen' }));
    fireEvent.click(screen.getByRole('button', { name: /Weiter/ }));
    expect(screen.getByText(/Tippe alle Ausgabegeräte an/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Monitor' })).toBeInTheDocument();
  });

  it('checked (Review) zeigt ALLE Gruppen aufgedeckt + gesperrt', () => {
    render(
      <HotspotBlock block={GROUP_BLOCK} answer={['a1', 'b1']} checked readOnly onSelect={vi.fn()} />
    );
    expect(screen.getByText(/Tippe alle Eingabegeräte an/)).toBeInTheDocument();
    expect(screen.getByText(/Tippe alle Ausgabegeräte an/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tastatur' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Monitor' })).toBeDisabled();
    // Im Review gibt es keinen Prüfen-Knopf.
    expect(screen.queryByRole('button', { name: 'Prüfen' })).not.toBeInTheDocument();
  });
});
