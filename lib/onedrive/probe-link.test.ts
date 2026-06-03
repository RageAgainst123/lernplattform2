import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { probeOneDriveUrl } from './probe-link';

// Phase Q (Sprint 5): HEAD-Request-Probe-Logik testen.
// Mockt globalThis.fetch um die verschiedenen Microsoft-Antworten zu simulieren.
//
// Die Funktion ist absichtlich tolerant: lieber "unverified" als
// fälschlich "broken". Tests decken die Status-Code-Matrix + den
// Login-Redirect-Spezialfall ab (Microsoft redirected oft zu
// login.microsoftonline.com wenn Permission "Personen in Org" gesetzt
// ist).

type FetchResponse = {
  status: number;
  ok: boolean;
  url: string;
};

function mockFetchOnce(response: FetchResponse) {
  globalThis.fetch = vi.fn(async () => response as Response);
}

function mockFetchReject() {
  globalThis.fetch = vi.fn(() => Promise.reject(new Error('network error')));
}

const SAMPLE_URL = 'https://nms-pitten-my.sharepoint.com/personal/x/Documents/Heft.docx';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('probeOneDriveUrl', () => {
  it('200 ohne Login-Redirect → ok', async () => {
    mockFetchOnce({ status: 200, ok: true, url: SAMPLE_URL });
    expect(await probeOneDriveUrl(SAMPLE_URL)).toBe('ok');
  });

  it('200 mit Redirect zu login.microsoftonline.com → unverified', async () => {
    mockFetchOnce({
      status: 200,
      ok: true,
      url: 'https://login.microsoftonline.com/common/oauth2/authorize?...',
    });
    expect(await probeOneDriveUrl(SAMPLE_URL)).toBe('unverified');
  });

  it('200 mit Redirect zu login.live.com → unverified (Microsoft-Personal-Login)', async () => {
    mockFetchOnce({ status: 200, ok: true, url: 'https://login.live.com/login.srf?...' });
    expect(await probeOneDriveUrl(SAMPLE_URL)).toBe('unverified');
  });

  it('401 (Unauthorized) → unverified (nicht broken — Lehrer:in könnte rein)', async () => {
    mockFetchOnce({ status: 401, ok: false, url: SAMPLE_URL });
    expect(await probeOneDriveUrl(SAMPLE_URL)).toBe('unverified');
  });

  it('403 (Forbidden) → unverified', async () => {
    mockFetchOnce({ status: 403, ok: false, url: SAMPLE_URL });
    expect(await probeOneDriveUrl(SAMPLE_URL)).toBe('unverified');
  });

  it('404 (Not Found) → broken', async () => {
    mockFetchOnce({ status: 404, ok: false, url: SAMPLE_URL });
    expect(await probeOneDriveUrl(SAMPLE_URL)).toBe('broken');
  });

  it('500 (Server Error) → unverified (nicht broken)', async () => {
    mockFetchOnce({ status: 500, ok: false, url: SAMPLE_URL });
    expect(await probeOneDriveUrl(SAMPLE_URL)).toBe('unverified');
  });

  it('Netzwerk-Fehler (fetch rejects) → unverified', async () => {
    mockFetchReject();
    expect(await probeOneDriveUrl(SAMPLE_URL)).toBe('unverified');
  });

  it('login-host-Check ist case-insensitive', async () => {
    mockFetchOnce({
      status: 200,
      ok: true,
      url: 'https://LOGIN.MicrosoftOnline.COM/oauth2',
    });
    expect(await probeOneDriveUrl(SAMPLE_URL)).toBe('unverified');
  });
});
