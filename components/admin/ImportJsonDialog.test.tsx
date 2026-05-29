import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportJsonDialog } from './ImportJsonDialog';

const VALID = JSON.stringify([
  { id: 'b1', type: 'text', content: 'Hallo' },
  { id: 'b2', type: 'infobox', content: 'Wichtig' },
]);

describe('ImportJsonDialog', () => {
  it('opens dialog on button click and accepts valid JSON', async () => {
    const user = userEvent.setup();
    const onImport = vi.fn();
    render(<ImportJsonDialog onImport={onImport} />);

    await user.click(screen.getByRole('button', { name: /JSON importieren/ }));
    const ta = screen.getByRole('textbox');
    await user.click(ta);
    await user.paste(VALID);
    await user.click(screen.getByRole('button', { name: 'Ersetzen' }));

    expect(onImport).toHaveBeenCalledWith(
      [
        { id: 'b1', type: 'text', content: 'Hallo' },
        { id: 'b2', type: 'infobox', content: 'Wichtig' },
      ],
      'replace'
    );
  });

  it('shows an error for invalid JSON', async () => {
    const user = userEvent.setup();
    const onImport = vi.fn();
    render(<ImportJsonDialog onImport={onImport} />);
    await user.click(screen.getByRole('button', { name: /JSON importieren/ }));
    await user.paste('{ not valid');
    await user.click(screen.getByRole('button', { name: 'Anhängen' }));
    expect(onImport).not.toHaveBeenCalled();
    expect(screen.getByText(/Ungültiges JSON|Unexpected/i)).toBeInTheDocument();
  });

  it('shows an error for JSON that does not match the block schema', async () => {
    const user = userEvent.setup();
    const onImport = vi.fn();
    render(<ImportJsonDialog onImport={onImport} />);
    await user.click(screen.getByRole('button', { name: /JSON importieren/ }));
    await user.paste(JSON.stringify([{ id: 'b1', type: 'unknown_type' }]));
    await user.click(screen.getByRole('button', { name: 'Anhängen' }));
    expect(onImport).not.toHaveBeenCalled();
  });
});
