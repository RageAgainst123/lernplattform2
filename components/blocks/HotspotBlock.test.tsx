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
  revealZones: true,
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

describe('HotspotBlock — versteckte Zonen (Frei-Klick)', () => {
  const HIDDEN: HotspotBlockType = { ...BLOCK, revealZones: false };
  // jsdom liefert sonst eine 0×0-Box → Klickkoordinaten unbrauchbar. Wir tun so,
  // als wäre das Bild 100×100px am Ursprung.
  function mockBox() {
    Element.prototype.getBoundingClientRect = vi.fn(
      () =>
        ({
          left: 0,
          top: 0,
          width: 100,
          height: 100,
          right: 100,
          bottom: 100,
          x: 0,
          y: 0,
        }) as DOMRect
    );
  }

  it('zeigt vor dem Prüfen KEINE Zonen-Rahmen, nur eine Such-Fläche', () => {
    render(<HotspotBlock block={HIDDEN} answer={[]} checked={false} onSelect={vi.fn()} />);
    // Keine Zonen-Buttons (Tastatur/Maus/Monitor) — nur die Frei-Klick-Fläche.
    expect(screen.queryByRole('button', { name: 'Tastatur' })).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Klicke die gesuchten Stellen im Bild an' })
    ).toBeInTheDocument();
  });

  it('zählt einen Klick in einer richtigen Zone als Treffer (areaId in Antwort)', () => {
    mockBox();
    const onSelect = vi.fn();
    // z1 (Tastatur) liegt bei x=0.2,y=0.5 (BLOCK). Klick auf den Mittelpunkt
    // (20px, 50px) in der 100×100-Box → Treffer auf z1.
    render(<HotspotBlock block={HIDDEN} answer={[]} checked={false} onSelect={onSelect} />);
    const surface = screen.getByRole('button', { name: 'Klicke die gesuchten Stellen im Bild an' });
    fireEvent.pointerDown(surface, { clientX: 20, clientY: 50 });
    expect(onSelect).toHaveBeenCalledWith(['z1']);
  });

  it('ein Klick ins Leere zählt NICHT als Treffer', () => {
    mockBox();
    const onSelect = vi.fn();
    render(<HotspotBlock block={HIDDEN} answer={[]} checked={false} onSelect={onSelect} />);
    const surface = screen.getByRole('button', { name: 'Klicke die gesuchten Stellen im Bild an' });
    fireEvent.pointerDown(surface, { clientX: 2, clientY: 2 });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('deckt nach dem Prüfen die Zonen auf (Rahmen sichtbar)', () => {
    render(<HotspotBlock block={HIDDEN} answer={['z1']} checked onSelect={vi.fn()} />);
    // Im checked-Modus wird der reguläre Zonen-Pfad gerendert.
    expect(screen.getByRole('button', { name: 'Tastatur' })).toBeInTheDocument();
  });

  it('setzt einen neutralen Marker auch bei einem Treffer (kein Live-grün)', () => {
    mockBox();
    const { container } = render(
      <HotspotBlock block={HIDDEN} answer={[]} checked={false} onSelect={vi.fn()} />
    );
    const surface = screen.getByRole('button', { name: 'Klicke die gesuchten Stellen im Bild an' });
    fireEvent.pointerDown(surface, { clientX: 20, clientY: 50 }); // Treffer z1
    // Marker ist neutral (primary), KEIN grünes Treffer-Häkchen mehr.
    expect(container.querySelector('.bg-green-500\\/90')).toBeNull();
    expect(container.querySelector('.bg-primary\\/80')).not.toBeNull();
  });

  it('begrenzt die Klicks per maxClicks + zeigt den Zähler', () => {
    mockBox();
    const onSelect = vi.fn();
    const limited: HotspotBlockType = { ...HIDDEN, maxClicks: 1 };
    render(<HotspotBlock block={limited} answer={[]} checked={false} onSelect={onSelect} />);
    const surface = screen.getByRole('button', { name: 'Klicke die gesuchten Stellen im Bild an' });
    fireEvent.pointerDown(surface, { clientX: 20, clientY: 50 }); // 1. Klick (Treffer z1)
    expect(screen.getByText(/1 \/ 1 Klicks/)).toBeInTheDocument();
    onSelect.mockClear();
    fireEvent.pointerDown(surface, { clientX: 50, clientY: 50 }); // 2. Klick → Limit
    expect(onSelect).not.toHaveBeenCalled();
  });
});

const GROUP_BLOCK: HotspotBlockType = {
  id: 'hsg1',
  type: 'hotspot',
  instruction: 'Schritt für Schritt.',
  imageUrl: 'https://example.com/bild.jpg',
  revealZones: true,
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
