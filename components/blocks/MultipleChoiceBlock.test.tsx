import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultipleChoiceBlock } from './MultipleChoiceBlock';
import type { MultipleChoiceBlock as MCBlockType } from '@/lib/schemas/blocks';

const BLOCK: MCBlockType = {
  id: 'mc1',
  type: 'multiple_choice',
  question: 'Welche Geräte sind Eingabegeräte?',
  options: [
    { id: 'o1', text: 'Tastatur', correct: true },
    { id: 'o2', text: 'Drucker', correct: false },
  ],
};

describe('MultipleChoiceBlock', () => {
  it('renders question and options', () => {
    render(<MultipleChoiceBlock block={BLOCK} selected={[]} checked={false} onToggle={vi.fn()} />);
    expect(screen.getByText(BLOCK.question)).toBeInTheDocument();
    expect(screen.getByText('Tastatur')).toBeInTheDocument();
    expect(screen.getByText('Drucker')).toBeInTheDocument();
  });

  it('calls onToggle when an option is clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<MultipleChoiceBlock block={BLOCK} selected={[]} checked={false} onToggle={onToggle} />);
    await user.click(screen.getByText('Tastatur'));
    expect(onToggle).toHaveBeenCalledWith('o1');
  });

  it('disables options when readOnly is true', () => {
    render(
      <MultipleChoiceBlock
        block={BLOCK}
        selected={[]}
        checked={false}
        readOnly
        onToggle={vi.fn()}
      />
    );
    for (const btn of screen.getAllByRole('button')) {
      expect(btn).toBeDisabled();
    }
  });

  it('disables options when checked (Quiz-Bewertung sichtbar)', () => {
    render(
      <MultipleChoiceBlock block={BLOCK} selected={['o1']} checked={true} onToggle={vi.fn()} />
    );
    for (const btn of screen.getAllByRole('button')) {
      expect(btn).toBeDisabled();
    }
  });
});
