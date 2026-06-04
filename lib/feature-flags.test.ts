import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { featureFlags, publicFeatureFlags } from './feature-flags';

const originalEnv = { ...process.env };

beforeEach(() => {
  // Reset auf Original (alle Test-Cases starten gleich).
  process.env = { ...originalEnv };
  delete process.env.QUIZ_DISABLED;
  delete process.env.LIVE_DISABLED;
  delete process.env.STUDENT_LOGIN_DISABLED;
  delete process.env.NEXT_PUBLIC_QUIZ_DISABLED;
  delete process.env.NEXT_PUBLIC_LIVE_DISABLED;
  delete process.env.NEXT_PUBLIC_STUDENT_LOGIN_DISABLED;
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('featureFlags', () => {
  it('alle Features default an wenn keine Env-Vars gesetzt', () => {
    expect(featureFlags.isQuizEnabled()).toBe(true);
    expect(featureFlags.isLiveEnabled()).toBe(true);
    expect(featureFlags.isStudentLoginEnabled()).toBe(true);
  });

  it('QUIZ_DISABLED=true deaktiviert nur Quiz', () => {
    process.env.QUIZ_DISABLED = 'true';
    expect(featureFlags.isQuizEnabled()).toBe(false);
    expect(featureFlags.isLiveEnabled()).toBe(true);
    expect(featureFlags.isStudentLoginEnabled()).toBe(true);
  });

  it('LIVE_DISABLED=true deaktiviert nur Live-Präsentation', () => {
    process.env.LIVE_DISABLED = 'true';
    expect(featureFlags.isQuizEnabled()).toBe(true);
    expect(featureFlags.isLiveEnabled()).toBe(false);
  });

  it('STUDENT_LOGIN_DISABLED=true deaktiviert Schüler-Login', () => {
    process.env.STUDENT_LOGIN_DISABLED = 'true';
    expect(featureFlags.isStudentLoginEnabled()).toBe(false);
  });

  it('andere Werte als "true" zählen als nicht deaktiviert', () => {
    process.env.QUIZ_DISABLED = 'false';
    expect(featureFlags.isQuizEnabled()).toBe(true);
    process.env.QUIZ_DISABLED = '1';
    expect(featureFlags.isQuizEnabled()).toBe(true);
    process.env.QUIZ_DISABLED = '';
    expect(featureFlags.isQuizEnabled()).toBe(true);
  });
});

describe('publicFeatureFlags', () => {
  it('liest NEXT_PUBLIC_-prefixed Env-Vars (Client-Bundle)', () => {
    process.env.NEXT_PUBLIC_QUIZ_DISABLED = 'true';
    expect(publicFeatureFlags.isQuizEnabled()).toBe(false);
    // Server-Flag bleibt eigenständig
    expect(featureFlags.isQuizEnabled()).toBe(true);
  });

  it('default an wenn keine NEXT_PUBLIC_-Vars gesetzt', () => {
    expect(publicFeatureFlags.isQuizEnabled()).toBe(true);
    expect(publicFeatureFlags.isLiveEnabled()).toBe(true);
    expect(publicFeatureFlags.isStudentLoginEnabled()).toBe(true);
  });
});
