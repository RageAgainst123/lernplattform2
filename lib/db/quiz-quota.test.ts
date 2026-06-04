import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const countMock = vi.fn();
const filterChain = {
  eq: vi.fn(),
  gte: vi.fn(),
  then(resolve: (v: { count: number | null }) => unknown) {
    return Promise.resolve({ count: countMock() }).then(resolve);
  },
};
filterChain.eq.mockImplementation(() => filterChain);
filterChain.gte.mockImplementation(() => filterChain);

vi.mock('@/lib/supabase/admin', () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => filterChain),
    })),
  })),
}));

import { checkQuizQuota } from './quiz-quota';

const originalEnv = { ...process.env };

beforeEach(() => {
  countMock.mockReset();
  filterChain.eq.mockClear();
  filterChain.gte.mockClear();
  process.env = { ...originalEnv };
  delete process.env.QUIZ_DAILY_LIMIT_PER_CLASS;
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('checkQuizQuota', () => {
  it('ok=true wenn count unter Default-Limit (20)', async () => {
    countMock.mockReturnValue(5);
    const res = await checkQuizQuota('c1');
    expect(res.ok).toBe(true);
    expect(res.used).toBe(5);
    expect(res.limit).toBe(20);
    expect(res.remaining).toBe(15);
    expect(res.warn).toBe(false);
  });

  it('warn=true bei 80% Auslastung (16/20)', async () => {
    countMock.mockReturnValue(16);
    const res = await checkQuizQuota('c1');
    expect(res.ok).toBe(true);
    expect(res.warn).toBe(true);
  });

  it('warn=true bei 95% Auslastung (19/20)', async () => {
    countMock.mockReturnValue(19);
    const res = await checkQuizQuota('c1');
    expect(res.ok).toBe(true);
    expect(res.warn).toBe(true);
    expect(res.remaining).toBe(1);
  });

  it('ok=false wenn Limit erreicht (20/20)', async () => {
    countMock.mockReturnValue(20);
    const res = await checkQuizQuota('c1');
    expect(res.ok).toBe(false);
    expect(res.remaining).toBe(0);
    expect(res.warn).toBe(true);
  });

  it('ok=false wenn Limit überschritten (defensive, 25/20)', async () => {
    countMock.mockReturnValue(25);
    const res = await checkQuizQuota('c1');
    expect(res.ok).toBe(false);
    expect(res.remaining).toBe(0);
  });

  it('count=null wird als 0 behandelt', async () => {
    countMock.mockReturnValue(null);
    const res = await checkQuizQuota('c1');
    expect(res.used).toBe(0);
    expect(res.ok).toBe(true);
  });

  it('respektiert QUIZ_DAILY_LIMIT_PER_CLASS env-var', async () => {
    process.env.QUIZ_DAILY_LIMIT_PER_CLASS = '5';
    countMock.mockReturnValue(5);
    const res = await checkQuizQuota('c1');
    expect(res.limit).toBe(5);
    expect(res.ok).toBe(false);
  });

  it('limit=0 → unlimited (für Dev/Test)', async () => {
    process.env.QUIZ_DAILY_LIMIT_PER_CLASS = '0';
    countMock.mockReturnValue(9999);
    const res = await checkQuizQuota('c1');
    expect(res.ok).toBe(true);
    expect(res.remaining).toBe(Infinity);
    expect(res.warn).toBe(false);
  });

  it('ungültige env-var fällt auf Default zurück', async () => {
    process.env.QUIZ_DAILY_LIMIT_PER_CLASS = 'bogus';
    countMock.mockReturnValue(5);
    const res = await checkQuizQuota('c1');
    expect(res.limit).toBe(20);
  });

  it('negative env-var fällt auf Default zurück', async () => {
    process.env.QUIZ_DAILY_LIMIT_PER_CLASS = '-5';
    countMock.mockReturnValue(5);
    const res = await checkQuizQuota('c1');
    expect(res.limit).toBe(20);
  });
});
