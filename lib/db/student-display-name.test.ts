import { describe, expect, it } from 'vitest';
import { studentDisplayName } from './student-display-name';

describe('studentDisplayName', () => {
  it('bevorzugt Vorname + Nachname', () => {
    expect(
      studentDisplayName({
        codename: 'max.muster',
        givenName: 'Max',
        surname: 'Mustermann',
        o365Email: 'max@x.at',
      })
    ).toBe('Max Mustermann');
  });

  it('fällt auf Vorname zurück wenn Nachname fehlt', () => {
    expect(
      studentDisplayName({ codename: 'x', givenName: 'Max', surname: '', o365Email: null })
    ).toBe('Max');
  });

  it('fällt auf Email-Lokalteil zurück wenn Namen fehlen', () => {
    expect(
      studentDisplayName({
        codename: '.',
        givenName: '',
        surname: '',
        o365Email: 'max.muster@x.at',
      })
    ).toBe('max.muster');
  });

  it('fällt auf codename zurück wenn keine Namen + keine Email', () => {
    expect(
      studentDisplayName({
        codename: 'flink-tiger-42',
        givenName: null,
        surname: null,
        o365Email: null,
      })
    ).toBe('flink-tiger-42');
  });

  it('verwirft defekten codename "." und "sso-user"', () => {
    expect(studentDisplayName({ codename: '.', givenName: '', surname: '', o365Email: '' })).toBe(
      'Schüler:in'
    );
    expect(
      studentDisplayName({ codename: 'sso-user', givenName: '', surname: '', o365Email: '' })
    ).toBe('Schüler:in');
  });

  it('trimmt whitespace in allen Feldern', () => {
    expect(
      studentDisplayName({ codename: '  ', givenName: '  Max  ', surname: '  Muster  ' })
    ).toBe('Max Muster');
  });
});
