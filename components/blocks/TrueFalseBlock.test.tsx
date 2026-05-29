import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrueFalseBlock } from './TrueFalseBlock';
import type { TrueFalseBlock as TFBlockType } from '@/lib/schemas/blocks';

const BLOCK: TFBlockType = {
  id: 'tf1',
  type: 'true_false',
  question: 'Ein Lautsprecher ist ein Eingabegerät.',
  answer: false,
};

describe('TrueFalseBlock', () => {
  it('renders question and both options', () => {
    render(<TrueFalseBlock block={BLOCK} selected={null} checked={false} onSelect={vi.fn()} />);
    expect(screen.getByText(BLOCK.question)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Wahr' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Falsch' })).toBeInTheDocument();
  });

  it('calls onSelect when an option is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<TrueFalseBlock block={BLOCK} selected={null} checked={false} onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: 'Wahr' }));
    expect(onSelect).toHaveBeenCalledWith(true);
  });

  it('disables buttons when readOnly', () => {
    render(
      <TrueFalseBlock block={BLOCK} selected={null} checked={false} readOnly onSelect={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: 'Wahr' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Falsch' })).toBeDisabled();
  });

  it('disables buttons when checked', () => {
    render(<TrueFalseBlock block={BLOCK} selected={false} checked={true} onSelect={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Wahr' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Falsch' })).toBeDisabled();
  });
});
