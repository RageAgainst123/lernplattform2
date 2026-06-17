import { describe, expect, it } from 'vitest';
import { isEmailDomainAllowed } from './email-domain';

describe('isEmailDomainAllowed', () => {
  it('lässt alle Domains durch wenn allowedDomains null ist', () => {
    expect(isEmailDomainAllowed('a@beliebig.at', null)).toBe(true);
  });

  it('lässt alle Domains durch wenn allowedDomains leer ist', () => {
    expect(isEmailDomainAllowed('a@beliebig.at', [])).toBe(true);
  });

  it('erlaubt passende Domain (lowercase)', () => {
    expect(isEmailDomainAllowed('max@ms-muster.at', ['ms-muster.at'])).toBe(true);
  });

  it('erlaubt Mischschreibweise: Email mit Großbuchstaben, Domain mit Kleinbuchstaben', () => {
    expect(isEmailDomainAllowed('Max@MS-Muster.AT', ['ms-muster.at'])).toBe(true);
  });

  it('blockt nicht-passende Domain', () => {
    expect(isEmailDomainAllowed('max@andere-schule.at', ['ms-muster.at'])).toBe(false);
  });

  it('erlaubt eine von mehreren Whitelist-Domains', () => {
    expect(isEmailDomainAllowed('max@b.at', ['a.at', 'b.at', 'c.at'])).toBe(true);
  });

  it('blockt defekte Email ohne @', () => {
    expect(isEmailDomainAllowed('keine-email', ['ms-muster.at'])).toBe(false);
  });

  it('blockt Email mit @ am Ende', () => {
    expect(isEmailDomainAllowed('max@', ['ms-muster.at'])).toBe(false);
  });

  it('trimmt whitespace in den Whitelist-Domains', () => {
    expect(isEmailDomainAllowed('max@b.at', [' b.at ', ' c.at '])).toBe(true);
  });
});
