// @vitest-environment node
// jose prüft `instanceof Uint8Array`; jsdom hat einen eigenen Realm-Konstruktor,
// wodurch der Check in jsdom fälschlich fehlschlägt. node-Environment fixt das
// (gleicher Trick wie in student-session.test.ts).
import { beforeEach, describe, expect, it } from 'vitest';
import {
  createSsoPendingSession,
  verifySsoPendingSession,
  SSO_PENDING_COOKIE,
  SSO_PENDING_COOKIE_OPTIONS,
} from './sso-pending-session';

// Phase O6 Tests für den sso_pending-jose-Cookie.
//
// Was wir hier prüfen:
//   - Round-Trip: createSsoPendingSession → verifySsoPendingSession liefert
//     dasselbe Payload zurück.
//   - Defekte Tokens werden mit null abgewiesen (kein throw).
//   - Cookie-Optionen sind sicher (HttpOnly, sameSite=lax, TTL = 10 Min).
//
// Was wir bewusst NICHT testen:
//   - Tatsächliche TTL-Expiry (würde Zeit-Mocking erfordern; jose's Verify
//     prüft das selbst und ist gut getestet).

beforeEach(() => {
  process.env.SESSION_SECRET = 'test-secret-with-at-least-32-bytes-for-jose-hmac';
});

describe('sso-pending-session', () => {
  it('macht einen Round-Trip Payload → Token → Payload', async () => {
    const payload = {
      oid: 'oid-123-stabil',
      email: 'max.muster@ms-muster.at',
      givenName: 'Max',
      surname: 'Mustermann',
    };
    const token = await createSsoPendingSession(payload);
    const decoded = await verifySsoPendingSession(token);
    expect(decoded).toEqual(payload);
  });

  it('verifiziert leere Strings als gültiges Payload (z.B. wenn Microsoft keinen Namen liefert)', async () => {
    const payload = { oid: 'oid-x', email: 'x@y.at', givenName: '', surname: '' };
    const token = await createSsoPendingSession(payload);
    const decoded = await verifySsoPendingSession(token);
    expect(decoded).toEqual(payload);
  });

  it('weist Müll-Token mit null ab statt zu throwen', async () => {
    expect(await verifySsoPendingSession('not-a-jwt')).toBeNull();
    expect(await verifySsoPendingSession('')).toBeNull();
    expect(await verifySsoPendingSession('a.b.c')).toBeNull();
  });

  it('weist Tokens mit fremdem Secret ab', async () => {
    const token = await createSsoPendingSession({
      oid: 'oid-1',
      email: 'a@b.at',
      givenName: 'A',
      surname: 'B',
    });
    process.env.SESSION_SECRET = 'ein-anderes-secret-mit-genug-bytes-fuer-jose-hmac';
    expect(await verifySsoPendingSession(token)).toBeNull();
  });

  it('hat einen eindeutigen Cookie-Namen != student_session', () => {
    expect(SSO_PENDING_COOKIE).toBe('sso_pending');
  });

  it('Cookie-Optionen sind sicher: HttpOnly + sameSite=lax + path=/ + TTL 10 Min', () => {
    expect(SSO_PENDING_COOKIE_OPTIONS.httpOnly).toBe(true);
    expect(SSO_PENDING_COOKIE_OPTIONS.sameSite).toBe('lax');
    expect(SSO_PENDING_COOKIE_OPTIONS.path).toBe('/');
    expect(SSO_PENDING_COOKIE_OPTIONS.maxAge).toBe(600);
  });
});
