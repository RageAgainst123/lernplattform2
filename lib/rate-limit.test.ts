import { beforeEach, describe, expect, it } from 'vitest';

import { checkRate, ipFromRequest, _resetRateLimitForTests } from './rate-limit';

beforeEach(() => {
  _resetRateLimitForTests();
});

describe('checkRate', () => {
  it('lässt erste Requests durch', () => {
    const r = checkRate('1.2.3.4', 1000);
    expect(r.ok).toBe(true);
    expect(r.remaining).toBe(99);
  });

  it('zählt remaining korrekt herunter', () => {
    checkRate('1.2.3.4', 1000);
    checkRate('1.2.3.4', 1001);
    const r = checkRate('1.2.3.4', 1002);
    expect(r.remaining).toBe(97);
  });

  it('blockt bei >100 Requests im 1-Min-Window', () => {
    for (let i = 0; i < 100; i++) {
      checkRate('1.2.3.4', 1000 + i);
    }
    const r = checkRate('1.2.3.4', 1100);
    expect(r.ok).toBe(false);
    expect(r.remaining).toBe(0);
  });

  it('blockt bei >100 Requests, lässt 101. abgelehnt zurückkommen', () => {
    let lastOk = true;
    for (let i = 0; i < 101; i++) {
      const r = checkRate('1.2.3.4', 1000 + i);
      lastOk = r.ok;
    }
    expect(lastOk).toBe(false);
  });

  it('isoliert pro IP — unterschiedliche IPs sind unabhängig', () => {
    for (let i = 0; i < 100; i++) {
      checkRate('1.2.3.4', 1000 + i);
    }
    const r = checkRate('5.6.7.8', 1100);
    expect(r.ok).toBe(true);
    expect(r.remaining).toBe(99);
  });

  it('resettet nach Window-Ablauf (60s)', () => {
    for (let i = 0; i < 100; i++) {
      checkRate('1.2.3.4', 1000 + i);
    }
    // 61s später
    const r = checkRate('1.2.3.4', 1000 + 61 * 1000);
    expect(r.ok).toBe(true);
    expect(r.remaining).toBe(99);
  });

  it('respektiert RATE_LIMIT_DISABLED env-var', () => {
    process.env.RATE_LIMIT_DISABLED = 'true';
    for (let i = 0; i < 200; i++) {
      const r = checkRate('1.2.3.4', 1000 + i);
      expect(r.ok).toBe(true);
    }
    delete process.env.RATE_LIMIT_DISABLED;
  });
});

describe('ipFromRequest', () => {
  it('liest x-real-ip wenn vorhanden', () => {
    const req = new Request('http://x', { headers: { 'x-real-ip': '1.2.3.4' } });
    expect(ipFromRequest(req)).toBe('1.2.3.4');
  });

  it('fällt auf x-forwarded-for zurück', () => {
    const req = new Request('http://x', { headers: { 'x-forwarded-for': '5.6.7.8, 9.10.11.12' } });
    expect(ipFromRequest(req)).toBe('5.6.7.8');
  });

  it('cf-connecting-ip hat Vorrang vor x-forwarded-for', () => {
    const req = new Request('http://x', {
      headers: { 'cf-connecting-ip': '1.1.1.1', 'x-forwarded-for': '2.2.2.2' },
    });
    expect(ipFromRequest(req)).toBe('1.1.1.1');
  });

  it('liefert "unknown" bei fehlenden Headern', () => {
    const req = new Request('http://x');
    expect(ipFromRequest(req)).toBe('unknown');
  });
});
