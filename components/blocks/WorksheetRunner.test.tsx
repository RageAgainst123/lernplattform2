import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorksheetRunner } from './WorksheetRunner';
import type { Block } from '@/lib/schemas/blocks';

// Stub next/navigation für useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

const BLOCKS: Block[] = [
  { id: 'b1', type: 'reflection', prompt: 'Was ist die Eingabe?', placeholder: 'Deine Antwort' },
  {
    id: 'b2',
    type: 'fill_blank',
    text: 'Beim EVA-Prinzip kommt zuerst die {0}.',
    solutions: ['Eingabe'],
    distractors: ['Verarbeitung'],
  },
];

describe('WorksheetRunner', () => {
  it('renders all blocks on one page with task numbers', () => {
    render(
      <WorksheetRunner
        blocks={BLOCKS}
        initialAnswers={{}}
        initialSubmittedAt={null}
        onSaveDraft={async () => {}}
        onSubmit={async () => {}}
      />
    );
    expect(screen.getByText('Aufgabe 1')).toBeInTheDocument();
    expect(screen.getByText('Aufgabe 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abgeben' })).toBeInTheDocument();
  });

  it('calls onSaveDraft (debounced) after user types', async () => {
    const user = userEvent.setup();
    const onSaveDraft = vi.fn().mockResolvedValue(undefined);
    render(
      <WorksheetRunner
        blocks={BLOCKS}
        initialAnswers={{}}
        initialSubmittedAt={null}
        onSaveDraft={onSaveDraft}
        onSubmit={async () => {}}
      />
    );
    const textarea = screen.getByPlaceholderText('Deine Antwort');
    await user.type(textarea, 'Tastatur');
    await waitFor(() => expect(onSaveDraft).toHaveBeenCalled(), { timeout: 1500 });
    const lastCall = onSaveDraft.mock.calls.at(-1)?.[0] as Record<string, unknown>;
    expect(lastCall?.b1).toBe('Tastatur');
  });

  it('calls onSubmit after confirm() on Abgeben click', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(
      <WorksheetRunner
        blocks={BLOCKS}
        initialAnswers={{ b1: 'Tastatur' }}
        initialSubmittedAt={null}
        onSaveDraft={async () => {}}
        onSubmit={onSubmit}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Abgeben' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit).toHaveBeenCalledWith({ b1: 'Tastatur' });
  });

  it('does NOT call onSubmit when user cancels confirm', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(
      <WorksheetRunner
        blocks={BLOCKS}
        initialAnswers={{}}
        initialSubmittedAt={null}
        onSaveDraft={async () => {}}
        onSubmit={onSubmit}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Abgeben' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('hides Abgeben button and disables inputs when already submitted', () => {
    render(
      <WorksheetRunner
        blocks={BLOCKS}
        initialAnswers={{ b1: 'Tastatur' }}
        initialSubmittedAt="2026-05-28T10:00:00Z"
        onSaveDraft={async () => {}}
        onSubmit={async () => {}}
      />
    );
    expect(screen.queryByRole('button', { name: 'Abgeben' })).not.toBeInTheDocument();
    expect(screen.getByText(/Abgegeben am/)).toBeInTheDocument();
    const textarea = screen.getByPlaceholderText('Deine Antwort');
    expect(textarea).toBeDisabled();
  });
});
