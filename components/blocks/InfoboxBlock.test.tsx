import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InfoboxBlock } from './InfoboxBlock';
import type { InfoboxBlock as InfoboxBlockType } from '@/lib/schemas/blocks';

describe('InfoboxBlock', () => {
  it('renders title and content', () => {
    const block: InfoboxBlockType = {
      id: 'i1',
      type: 'infobox',
      title: 'Merke',
      content: 'EVA ist Eingabe, Verarbeitung, Ausgabe.',
    };
    render(<InfoboxBlock block={block} />);
    expect(screen.getByText('Merke')).toBeInTheDocument();
    expect(screen.getByText(/EVA ist Eingabe/)).toBeInTheDocument();
  });

  it('renders content without a title when title is missing', () => {
    const block: InfoboxBlockType = { id: 'i1', type: 'infobox', content: 'Nur Inhalt' };
    render(<InfoboxBlock block={block} />);
    expect(screen.getByText('Nur Inhalt')).toBeInTheDocument();
  });
});
