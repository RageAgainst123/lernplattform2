import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemaAccordion } from './ThemaAccordion';
import type { TopicWithContent } from '@/lib/db/public-content';

const topics: TopicWithContent[] = [
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
  {
    topic: 'Was ist ein Computer',
    slug: 'was-ist-ein-computer',
    materials: [],
    modules: [{ id: 'u1', title: 'Quiz', description: null, topic: 'Was ist ein Computer' }],
  },
];

beforeEach(() => {
  window.location.hash = '';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ThemaAccordion', () => {
  it('renders one trigger per topic, all initially collapsed', () => {
    render(<ThemaAccordion topics={topics} />);
    const triggers = screen.getAllByRole('button');
    expect(triggers).toHaveLength(2);
    for (const t of triggers) {
      expect(t).toHaveAttribute('aria-expanded', 'false');
    }
  });

  it('opens an item on click and toggles closed on a second click', async () => {
    const user = userEvent.setup();
    render(<ThemaAccordion topics={topics} />);
    const trigger = screen.getByRole('button', { name: /EVA-Prinzip/ });
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('supports multiple items open in parallel', async () => {
    const user = userEvent.setup();
    render(<ThemaAccordion topics={topics} />);
    const a = screen.getByRole('button', { name: /EVA-Prinzip/ });
    const b = screen.getByRole('button', { name: /Was ist ein Computer/ });
    await user.click(a);
    await user.click(b);
    expect(a).toHaveAttribute('aria-expanded', 'true');
    expect(b).toHaveAttribute('aria-expanded', 'true');
  });

  it('opens the matching item when the URL hash points to its slug', () => {
    window.location.hash = '#eva-prinzip';
    render(<ThemaAccordion topics={topics} />);
    const trigger = screen.getByRole('button', { name: /EVA-Prinzip/ });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const other = screen.getByRole('button', { name: /Was ist ein Computer/ });
    expect(other).toHaveAttribute('aria-expanded', 'false');
  });

  it('writes the slug to the URL hash when an item is opened', async () => {
    const replaceSpy = vi.spyOn(window.history, 'replaceState');
    const user = userEvent.setup();
    render(<ThemaAccordion topics={topics} />);
    await user.click(screen.getByRole('button', { name: /EVA-Prinzip/ }));
    expect(replaceSpy).toHaveBeenCalled();
    const lastCall = replaceSpy.mock.calls.at(-1);
    const targetUrl = String(lastCall?.[2] ?? '');
    expect(targetUrl).toContain('#eva-prinzip');
  });

  it('reacts to hashchange events fired by the browser', () => {
    render(<ThemaAccordion topics={topics} />);
    const trigger = screen.getByRole('button', { name: /Was ist ein Computer/ });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    act(() => {
      window.location.hash = '#was-ist-ein-computer';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});
