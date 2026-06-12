import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TiptapHeftHint } from './TiptapHeftHint';

// Heft-Hinweis für Code+PIN-Schüler:innen auf der Themen-Seite (HEFT-CRIT-2).

describe('TiptapHeftHint', () => {
  it('rendert Themen-Label + Link aufs Tiptap-Heft', () => {
    render(<TiptapHeftHint topicLabel="Sichere Passwörter" />);
    expect(screen.getByText(/Sichere Passwörter/)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Schulheft öffnen/ });
    expect(link).toHaveAttribute('href', '/s/heft');
  });
});
