import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LabelImageBlock } from './LabelImageBlock';
import type { LabelImageBlock as LabelImageBlockType } from '@/lib/schemas/blocks';

const BLOCK: LabelImageBlockType = {
  id: 'li1',
  type: 'label_image',
  instruction: 'Beschrifte die Computer-Teile.',
  imageUrl: 'https://example.com/bild.jpg',
  imageAlt: 'Ein Computer-Arbeitsplatz',
  revealZones: true,
  zoomable: false,
  zones: [
    { id: 'z1', label: 'Maus', x: 0.2, y: 0.5, shape: 'circle', r: 0.1, rotation: 0 },
    { id: 'z2', label: 'Tastatur', x: 0.5, y: 0.5, shape: 'circle', r: 0.1, rotation: 0 },
    { id: 'z3', label: 'Bildschirm', x: 0.8, y: 0.3, shape: 'circle', r: 0.1, rotation: 0 },
  ],
};

describe('LabelImageBlock — sichtbarer Modus', () => {
  it('rendert Instruktion + einen Marker pro Zone + alle Begriffe im Pool', () => {
    render(<LabelImageBlock block={BLOCK} assignment={{}} checked={false} onAssign={vi.fn()} />);
    expect(screen.getByText('Beschrifte die Computer-Teile.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stelle 1 beschriften' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stelle 2 beschriften' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stelle 3 beschriften' })).toBeInTheDocument();
    // Begriff-Chips im Pool.
    expect(screen.getByRole('button', { name: 'Maus' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tastatur' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bildschirm' })).toBeInTheDocument();
  });

  it('ordnet nach Zone-Klick + Begriff-Klick den Begriff der Zone zu', () => {
    const onAssign = vi.fn();
    render(<LabelImageBlock block={BLOCK} assignment={{}} checked={false} onAssign={onAssign} />);
    fireEvent.click(screen.getByRole('button', { name: 'Stelle 1 beschriften' }));
    // Hinweis erscheint, Pool ist „armed".
    expect(screen.getByText(/Welcher Begriff gehört zu Stelle 1\?/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tastatur' }));
    expect(onAssign).toHaveBeenCalledWith({ z1: 'Tastatur' });
  });

  it('zeigt einen zugeordneten Begriff im Marker + nimmt ihn aus dem Pool', () => {
    render(
      <LabelImageBlock
        block={BLOCK}
        assignment={{ z1: 'Maus' }}
        checked={false}
        onAssign={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'Stelle 1: Maus' })).toBeInTheDocument();
    // „Maus" ist zugeordnet → nicht mehr als Pool-Chip vorhanden (nur der Marker).
    expect(screen.queryByRole('button', { name: 'Maus' })).not.toBeInTheDocument();
  });

  it('legt einen Begriff via „×" zurück in den Pool', () => {
    const onAssign = vi.fn();
    render(
      <LabelImageBlock
        block={BLOCK}
        assignment={{ z1: 'Maus' }}
        checked={false}
        onAssign={onAssign}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Maus zurücklegen' }));
    expect(onAssign).toHaveBeenCalledWith({});
  });

  it('markiert nach dem Prüfen richtig/falsch + sperrt die Marker', () => {
    render(
      <LabelImageBlock
        block={BLOCK}
        assignment={{ z1: 'Maus', z2: 'Bildschirm' }}
        checked
        onAssign={vi.fn()}
      />
    );
    // checked → Marker tragen den Begriff, sind aber gesperrt.
    expect(screen.getByRole('button', { name: 'Stelle 1: Maus' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Stelle 2: Bildschirm' })).toBeDisabled();
    // Im gesperrten Modus gibt es keinen Pool mehr.
    expect(screen.queryByText(/Welcher Begriff gehört zu/)).not.toBeInTheDocument();
  });

  it('sperrt Interaktion im readOnly-Modus', () => {
    const onAssign = vi.fn();
    render(
      <LabelImageBlock block={BLOCK} assignment={{}} checked={false} readOnly onAssign={onAssign} />
    );
    expect(screen.getByRole('button', { name: 'Stelle 1 beschriften' })).toBeDisabled();
  });
});

describe('LabelImageBlock — versteckter Modus (Frei-Klick)', () => {
  const HIDDEN: LabelImageBlockType = { ...BLOCK, revealZones: false };
  // jsdom liefert sonst eine 0×0-Box. Wir tun so, als wäre das Bild 100×100px.
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

  it('zeigt vor dem Prüfen KEINE Marker, nur eine Such-Fläche', () => {
    render(<LabelImageBlock block={HIDDEN} assignment={{}} checked={false} onAssign={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Stelle 1 beschriften' })).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Klicke die Stelle an, die du beschriften willst' })
    ).toBeInTheDocument();
  });

  it('ein Klick in einer Zone aktiviert sie zum Beschriften', () => {
    mockBox();
    render(<LabelImageBlock block={HIDDEN} assignment={{}} checked={false} onAssign={vi.fn()} />);
    const surface = screen.getByRole('button', {
      name: 'Klicke die Stelle an, die du beschriften willst',
    });
    // z1 (Maus) liegt bei x=0.2,y=0.5 → Klick (20px,50px) trifft z1.
    fireEvent.pointerDown(surface, { clientX: 20, clientY: 50 });
    expect(screen.getByText(/Welcher Begriff gehört zu Stelle 1\?/)).toBeInTheDocument();
  });

  it('deckt nach dem Prüfen die Zonen-Marker auf', () => {
    render(
      <LabelImageBlock block={HIDDEN} assignment={{ z1: 'Maus' }} checked onAssign={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: 'Stelle 1: Maus' })).toBeInTheDocument();
  });
});
