import { describe, expect, it } from 'vitest';
import { buildCodenameBase } from './sso-codename';

// Phase O6 Tests für die Codename-Slug-Logik. Wichtig, weil der erste
// O365-Roll-out gezeigt hat: wenn given_name + surname leer sind UND wir
// fallen nicht sauber auf den Email-Lokalteil zurück, wird der Codename "."
// und die Header-Anzeige defekt.

describe('buildCodenameBase', () => {
  it('bevorzugt vorname.nachname', () => {
    expect(buildCodenameBase('Max', 'Mustermann', 'max@x.at')).toBe('max.mustermann');
  });

  it('lowercased und slugifiziert Umlaute weg', () => {
    expect(buildCodenameBase('Jörg', 'Müller', 'j@x.at')).toBe('jrg.mller');
  });

  it('fällt auf nur Vorname zurück wenn Nachname leer', () => {
    expect(buildCodenameBase('Max', '', 'x@y.at')).toBe('max');
  });

  it('fällt auf nur Nachname zurück wenn Vorname leer', () => {
    expect(buildCodenameBase('', 'Mustermann', 'x@y.at')).toBe('mustermann');
  });

  it('fällt auf Email-Lokalteil zurück wenn Namen komplett leer', () => {
    expect(buildCodenameBase('', '', 'max.muster@ms-muster.at')).toBe('max.muster');
  });

  it('fällt auf "sso-user" zurück wenn alles leer/defekt ist', () => {
    expect(buildCodenameBase('', '', '')).toBe('sso-user');
    expect(buildCodenameBase('', '', '@')).toBe('sso-user');
    expect(buildCodenameBase('', '', '???')).toBe('sso-user');
  });

  it('regression: zwei einzelne "." aus leeren Namen werden NICHT zu codename "."', () => {
    // Das war der Bug aus dem ersten Roll-out: die alte Implementation
    // hat '..' produziert, jetzt fallen wir sauber auf den Email-Lokalteil.
    const result = buildCodenameBase('', '', 'echtername@x.at');
    expect(result).not.toBe('.');
    expect(result).not.toBe('..');
    expect(result).toBe('echtername');
  });

  it('clampt auf max 80 Zeichen', () => {
    const long = 'a'.repeat(100);
    expect(buildCodenameBase(long, long, 'x@y.at').length).toBeLessThanOrEqual(80);
  });

  it('entfernt führende und folgende Sonderzeichen', () => {
    expect(buildCodenameBase('--Max--', '..Muster..', 'x@y.at')).toBe('max.muster');
  });

  it('komprimiert mehrfach-Punkte', () => {
    expect(buildCodenameBase('A...B', '', 'x@y.at')).toBe('a.b');
  });
});
