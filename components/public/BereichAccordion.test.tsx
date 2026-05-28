import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BereichAccordion } from './BereichAccordion';
import type { BereichWithTopics } from '@/lib/db/public-content-stufe';
import type { Kompetenzbereich } from '@/lib/schemas/entities';

const bereiche: BereichWithTopics[] = [
  {
    bereich: 'orientierung' as Kompetenzbereich,
    topics: [
      {
        topic: 'EVA-Prinzip',
        slug: 'eva-prinzip',
        materials: [
          {
            id: 'm1',
            title: 'Arbeitsblatt',
            description: null,
            materialType: 'arbeitsblatt',
            fileUrl: 'https://example/m1.pdf',
          },
        ],
        modules: [],
      },
    ],
  },
  { bereich: 'information' as Kompetenzbereich, topics: [] },
  { bereich: 'kommunikation' as Kompetenzbereich, topics: [] },
  { bereich: 'produktion' as Kompetenzbereich, topics: [] },
  { bereich: 'handeln' as Kompetenzbereich, topics: [] },
];

beforeEach(() => {
  window.location.hash = '';
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('BereichAccordion', () => {
  it('renders one trigger per bereich (also empty ones), all initially collapsed', () => {
    render(<BereichAccordion bereiche={bereiche} />);
    expect(screen.getByRole('button', { name: /Orientierung/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(screen.getByRole('button', { name: /Information/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(screen.getByRole('button', { name: /Kommunikation/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('opens orientierung on click and reveals the inner topic trigger', async () => {
    const user = userEvent.setup();
    render(<BereichAccordion bereiche={bereiche} />);
    const outer = screen.getByRole('button', { name: /Orientierung/ });
    await user.click(outer);
    expect(outer).toHaveAttribute('aria-expanded', 'true');
    // Inneres Thema sichtbar
    expect(screen.getByRole('button', { name: /EVA-Prinzip/ })).toBeInTheDocument();
  });

  it('opens both layers when the hash points to bereich/topic', () => {
    window.location.hash = '#orientierung/eva-prinzip';
    render(<BereichAccordion bereiche={bereiche} />);
    expect(screen.getByRole('button', { name: /Orientierung/ })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByRole('button', { name: /EVA-Prinzip/ })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('writes the nested hash when the inner topic is opened', async () => {
    window.location.hash = '#orientierung';
    const replaceSpy = vi.spyOn(window.history, 'replaceState');
    const user = userEvent.setup();
    render(<BereichAccordion bereiche={bereiche} />);
    // Bereich wurde via Hash bereits geöffnet → EVA-Trigger sichtbar
    const evaTrigger = screen.getByRole('button', { name: /EVA-Prinzip/ });
    await user.click(evaTrigger);
    const lastCall = replaceSpy.mock.calls.at(-1);
    expect(String(lastCall?.[2] ?? '')).toContain('#orientierung/eva-prinzip');
  });

  it('shows an empty-state inside a bereich that has no topics', async () => {
    const user = userEvent.setup();
    render(<BereichAccordion bereiche={bereiche} />);
    await user.click(screen.getByRole('button', { name: /Information/ }));
    expect(screen.getByText(/noch keine Inhalte/i)).toBeInTheDocument();
  });

  it('responds to manual hashchange events', () => {
    render(<BereichAccordion bereiche={bereiche} />);
    expect(screen.getByRole('button', { name: /Kommunikation/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    act(() => {
      window.location.hash = '#kommunikation';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(screen.getByRole('button', { name: /Kommunikation/ })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });
});
