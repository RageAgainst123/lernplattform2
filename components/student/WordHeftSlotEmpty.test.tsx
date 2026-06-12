import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// V8: Live-Warnung bei Links von privaten Microsoft-Konten
// (onedrive.live.com / 1drv.ms). Speichern bleibt erlaubt.

vi.mock('server-only', () => ({}));
vi.mock('@/lib/db/word-heft-actions', () => ({
  saveWordHeftLink: vi.fn(),
}));

import { WordHeftSlotEmpty } from './WordHeftSlotEmpty';

function openInputAndType(url: string) {
  render(<WordHeftSlotEmpty onSaved={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /Ich habe schon einen Link/ }));
  fireEvent.change(screen.getByLabelText(/Freigabe-Link/), { target: { value: url } });
}

describe('WordHeftSlotEmpty — Privat-Konto-Warnung (V8)', () => {
  it('warnt live bei onedrive.live.com, Speichern-Button bleibt aktiv', () => {
    openInputAndType('https://onedrive.live.com/edit.aspx?cid=abc');
    expect(screen.getByRole('status').textContent).toContain('privaten Microsoft-Konto');
    expect(screen.getByRole('button', { name: 'Link speichern' })).toBeEnabled();
  });

  it('keine Warnung bei Schul-Link (sharepoint.com)', () => {
    openInputAndType('https://nms-pitten-my.sharepoint.com/x.docx');
    expect(screen.queryByRole('status')).toBeNull();
  });
});
