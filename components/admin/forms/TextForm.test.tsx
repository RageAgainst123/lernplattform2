import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// V9: TextForm bekommt den geteilten Bild-Picker (ImageSourceBar) + Vorschau
// + Entfernen-Aktion; das URL-Feld bleibt als Fallback.

vi.mock('server-only', () => ({}));
vi.mock('@/lib/db/hotspot-image-actions', () => ({
  uploadHotspotImage: vi.fn(),
}));

import { TextForm } from './TextForm';
import type { TextBlock } from '@/lib/schemas/blocks';

const baseBlock: TextBlock = { id: 'b1', type: 'text', content: 'Hallo' };

describe('TextForm — Bild-Picker (V9)', () => {
  it('ohne Bild: zeigt Upload/Pexels-Picker + URL-Fallback-Feld', () => {
    render(<TextForm value={baseBlock} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Bild hochladen/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pexels durchsuchen/ })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Bild-URL einfügen/)).toBeInTheDocument();
  });

  it('mit Bild: zeigt Vorschau + Entfernen setzt imageUrl auf undefined', () => {
    const onChange = vi.fn();
    render(
      <TextForm
        value={{ ...baseBlock, imageUrl: 'https://example.com/bild.jpg' }}
        onChange={onChange}
      />
    );
    expect(document.querySelector('img')?.getAttribute('src')).toBe('https://example.com/bild.jpg');
    fireEvent.click(screen.getByRole('button', { name: /Bild entfernen/ }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ imageUrl: undefined }));
  });
});
