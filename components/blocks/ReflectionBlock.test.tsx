import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReflectionBlock } from './ReflectionBlock';
import type { ReflectionBlock as ReflectionBlockType } from '@/lib/schemas/blocks';

const BLOCK: ReflectionBlockType = {
  id: 'r1',
  type: 'reflection',
  prompt: 'Nenne ein Beispiel aus deinem Alltag.',
  placeholder: 'Z. B. Taschenrechner …',
};

describe('ReflectionBlock', () => {
  it('renders the prompt and textarea with placeholder', () => {
    render(<ReflectionBlock block={BLOCK} value="" onChange={vi.fn()} />);
    expect(screen.getByText(BLOCK.prompt)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Z. B. Taschenrechner …')).toBeInTheDocument();
  });

  it('shows the current value in the textarea', () => {
    render(<ReflectionBlock block={BLOCK} value="Meine Antwort" onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('Meine Antwort')).toBeInTheDocument();
  });

  it('calls onChange when the user types', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ReflectionBlock block={BLOCK} value="" onChange={onChange} />);
    await user.type(screen.getByPlaceholderText('Z. B. Taschenrechner …'), 'A');
    expect(onChange).toHaveBeenCalledWith('A');
  });

  it('disables the textarea when readOnly', () => {
    render(<ReflectionBlock block={BLOCK} value="X" readOnly onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('X')).toBeDisabled();
  });
});
