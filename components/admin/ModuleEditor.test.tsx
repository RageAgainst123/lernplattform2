import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// V5: Warn-Banner „N Schüler:innen haben begonnen" im Editor. Nur Hinweis,
// blockiert nichts — deshalb role="status" statt alert.

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('@/lib/db/module-actions', () => ({
  createModule: vi.fn(),
  updateModule: vi.fn(),
}));

import { ModuleEditor, type ModuleMetadata } from './ModuleEditor';

const meta: ModuleMetadata = {
  title: 'Testmodul',
  description: '',
  schulstufe: 5,
  kompetenzbereich: null,
  topic: '',
  estimatedMinutes: null,
  isPublished: false,
  activityKind: 'lernmodul',
  displayMode: 'quiz',
};

describe('ModuleEditor — Fortschritts-Warn-Banner (V5)', () => {
  it('zeigt amber Banner wenn Schüler:innen Fortschritt haben', () => {
    render(<ModuleEditor moduleId="m-1" initialMeta={meta} initialBlocks={[]} progressCount={4} />);
    const banner = screen.getByRole('status');
    expect(banner.textContent).toContain('4 Schüler:innen haben');
    expect(banner.textContent).toContain('duplizieren');
  });

  it('Singular-Form bei genau 1 Schüler:in', () => {
    render(<ModuleEditor moduleId="m-1" initialMeta={meta} initialBlocks={[]} progressCount={1} />);
    expect(screen.getByRole('status').textContent).toContain('1 Schüler:in hat');
  });

  it('kein Banner bei progressCount 0 oder ohne Prop', () => {
    const { unmount } = render(
      <ModuleEditor moduleId="m-1" initialMeta={meta} initialBlocks={[]} progressCount={0} />
    );
    expect(screen.queryByRole('status')).toBeNull();
    unmount();
    render(<ModuleEditor initialMeta={meta} initialBlocks={[]} />);
    expect(screen.queryByRole('status')).toBeNull();
  });
});
