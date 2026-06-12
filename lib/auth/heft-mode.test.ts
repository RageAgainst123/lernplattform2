import { describe, expect, it, vi } from 'vitest';

// getHeftMode: SSO (o365Email gesetzt) → 'word', Code+PIN → 'tiptap'.

vi.mock('server-only', () => ({}));

const getStudentIdentityById = vi.fn();
vi.mock('@/lib/db/student-login', () => ({
  getStudentIdentityById: (...args: unknown[]) => getStudentIdentityById(...args),
}));

import { getHeftMode } from './heft-mode';

describe('getHeftMode', () => {
  it("SSO-Schüler:in (o365Email) → 'word'", async () => {
    getStudentIdentityById.mockResolvedValueOnce({
      codename: null,
      givenName: 'Anna',
      surname: 'Muster',
      o365Email: 'anna@nms-pitten.at',
    });
    expect(await getHeftMode('sc-1')).toBe('word');
  });

  it("Code+PIN-Schüler:in (kein o365Email) → 'tiptap'", async () => {
    getStudentIdentityById.mockResolvedValueOnce({
      codename: '5T-01',
      givenName: null,
      surname: null,
      o365Email: null,
    });
    expect(await getHeftMode('sc-2')).toBe('tiptap');
  });

  it("unbekannte id (null) → 'tiptap' (sicherer Default)", async () => {
    getStudentIdentityById.mockResolvedValueOnce(null);
    expect(await getHeftMode('sc-x')).toBe('tiptap');
  });
});
