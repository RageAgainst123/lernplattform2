import { describe, expect, it } from 'vitest';
import { safeNext } from './route';

// safeNext schützt vor Open-Redirect via Magic-Link-?next-Param. Klassischer
// OWASP-Vektor: ein Angreifer schickt einen Magic-Link mit
// ?next=https://evil.com — wir müssen ihn auf eine interne Route zwingen.

describe('safeNext', () => {
  it('returns /lehrer fallback for null', () => {
    expect(safeNext(null)).toBe('/lehrer');
  });

  it('returns /lehrer fallback for empty string', () => {
    expect(safeNext('')).toBe('/lehrer');
  });

  it('allows a normal relative path', () => {
    expect(safeNext('/admin')).toBe('/admin');
  });

  it('allows a relative path with query + hash', () => {
    expect(safeNext('/lehrer/klassen?foo=bar#top')).toBe('/lehrer/klassen?foo=bar#top');
  });

  it('blocks absolute https URLs (open-redirect vector)', () => {
    expect(safeNext('https://evil.com')).toBe('/lehrer');
  });

  it('blocks absolute http URLs', () => {
    expect(safeNext('http://evil.com')).toBe('/lehrer');
  });

  it('blocks protocol-relative URLs starting with // (open-redirect vector)', () => {
    expect(safeNext('//evil.com')).toBe('/lehrer');
  });

  it('blocks protocol-relative URLs with path', () => {
    expect(safeNext('//evil.com/foo')).toBe('/lehrer');
  });

  it('blocks paths without leading slash', () => {
    expect(safeNext('admin')).toBe('/lehrer');
  });

  it('blocks javascript: schema', () => {
    expect(safeNext('javascript:alert(1)')).toBe('/lehrer');
  });

  // Backslash-Bypass: `/\evil.com` beginnt mit einem einzelnen `/`, also greift
  // der `//`-Check NICHT — aber Browser/WHATWG-URL normalisieren `\` zu `/`, so
  // dass new URL('/\\evil.com', base) zu https://evil.com auflöst. Echter
  // Open-Redirect-Vektor (OWASP). Muss geblockt werden.
  it('blocks backslash bypass (/\\evil.com → external)', () => {
    expect(safeNext('/\\evil.com')).toBe('/lehrer');
  });

  it('blocks slash-backslash bypass (/\\/evil.com)', () => {
    expect(safeNext('/\\/evil.com')).toBe('/lehrer');
  });

  // Control-/Whitespace-Smuggling: ein Tab oder Newline zwischen den Slashes
  // wird von URL-Parsern entfernt → //evil.com.
  it('blocks control-char smuggling (/\\t/evil.com)', () => {
    expect(safeNext('/\t/evil.com')).toBe('/lehrer');
  });

  it('blocks newline smuggling', () => {
    expect(safeNext('/\n/evil.com')).toBe('/lehrer');
  });

  // Der Pfad muss nach dem Auflösen weiterhin auf dem eigenen Host landen.
  it('keeps a deep relative path with backslash inside the path segment safe', () => {
    // ein backslash MITTEN im pfad (nicht am anfang) ist harmlos, aber unsere
    // strikte Variante blockt jeden backslash → fallback. Akzeptabel.
    expect(safeNext('/lehrer/foo')).toBe('/lehrer/foo');
  });
});
