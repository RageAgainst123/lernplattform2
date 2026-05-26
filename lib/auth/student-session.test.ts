// @vitest-environment node
// jose prüft `instanceof Uint8Array`; jsdom hat einen eigenen Realm-Konstruktor,
// wodurch der Check in jsdom fälschlich fehlschlägt. Im echten Node-/Edge-Runtime
// (und mit dieser node-Umgebung) funktioniert es korrekt.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createStudentSession, verifyStudentSession } from '@/lib/auth/student-session';

const ORIGINAL = process.env.SESSION_SECRET;

beforeAll(() => {
  process.env.SESSION_SECRET = 'test-secret-mindestens-32-zeichen-lang-1234';
});

afterAll(() => {
  process.env.SESSION_SECRET = ORIGINAL;
});

describe('createStudentSession / verifyStudentSession', () => {
  it('signs and verifies a valid session (roundtrip)', async () => {
    const token = await createStudentSession({ studentCodeId: 'sc-1', classId: 'c-1' });
    const session = await verifyStudentSession(token);
    expect(session).toEqual({ studentCodeId: 'sc-1', classId: 'c-1' });
  });

  it('returns null for a malformed token', async () => {
    expect(await verifyStudentSession('not-a-jwt')).toBeNull();
  });

  it('returns null for a token signed with a different secret', async () => {
    const token = await createStudentSession({ studentCodeId: 'sc-1', classId: 'c-1' });
    process.env.SESSION_SECRET = 'ein-voellig-anderes-secret-zum-testen-9999';
    const session = await verifyStudentSession(token);
    process.env.SESSION_SECRET = 'test-secret-mindestens-32-zeichen-lang-1234';
    expect(session).toBeNull();
  });
});
