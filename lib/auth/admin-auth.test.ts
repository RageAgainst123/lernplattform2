import { describe, expect, it, vi } from 'vitest';

// requireAdmin ruft Next-Server-APIs (redirect, cookies) — testen wir nur
// die pure isAdmin-Logik. Der Redirect-Pfad ist durch teacher-auth-Tests
// + Browser-Smoke abgedeckt.
vi.mock('server-only', () => ({}));

import { isAdmin } from './admin-auth';

describe('isAdmin', () => {
  it('returns false for null, undefined, or empty', () => {
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
    expect(isAdmin('')).toBe(false);
  });

  it('returns true for the allow-listed email', () => {
    expect(isAdmin('geoschlegel@gmail.com')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isAdmin('GeoSchlegel@Gmail.COM')).toBe(true);
    expect(isAdmin('GEOSCHLEGEL@GMAIL.COM')).toBe(true);
  });

  it('tolerates surrounding whitespace', () => {
    expect(isAdmin('  geoschlegel@gmail.com  ')).toBe(true);
  });

  it('returns false for non-admin lecturers', () => {
    expect(isAdmin('lehrer@schule.at')).toBe(false);
    expect(isAdmin('andere@example.com')).toBe(false);
  });

  it('returns false for similar-looking but different addresses', () => {
    expect(isAdmin('geoschlegel@gmail.de')).toBe(false);
    expect(isAdmin('geo.schlegel@gmail.com')).toBe(false);
  });
});
