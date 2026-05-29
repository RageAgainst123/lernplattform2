import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TextBlock } from './TextBlock';
import type { TextBlock as TextBlockType } from '@/lib/schemas/blocks';

// TextBlock ist reines Lese-Markup — Smoke deckt Content + optionales Bild ab.

describe('TextBlock', () => {
  it('renders the content', () => {
    const block: TextBlockType = { id: 't1', type: 'text', content: 'Hallo Welt' };
    render(<TextBlock block={block} />);
    expect(screen.getByText('Hallo Welt')).toBeInTheDocument();
  });

  it('renders an image when imageUrl is set', () => {
    const block: TextBlockType = {
      id: 't1',
      type: 'text',
      content: 'Mit Bild',
      imageUrl: 'https://example.com/foo.png',
    };
    const { container } = render(<TextBlock block={block} />);
    // alt="" → präsentational, daher KEIN role=img — direkt per Tag suchen.
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute('src', 'https://example.com/foo.png');
  });

  it('omits the image when imageUrl is not set', () => {
    const block: TextBlockType = { id: 't1', type: 'text', content: 'Ohne Bild' };
    const { container } = render(<TextBlock block={block} />);
    expect(container.querySelector('img')).toBeNull();
  });
});
