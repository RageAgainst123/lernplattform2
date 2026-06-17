import { describe, expect, it } from 'vitest';
import { tokenize, wordCount } from './tokenize';

describe('tokenize', () => {
  it('zerlegt einfachen Satz in Wort- und Trenn-Tokens', () => {
    const tokens = tokenize('Hund und Katze');
    expect(tokens.map((t) => t.text)).toEqual(['Hund', ' ', 'und', ' ', 'Katze']);
    expect(tokens.filter((t) => t.isWord).map((t) => t.text)).toEqual(['Hund', 'und', 'Katze']);
  });

  it('vergibt fortlaufende wordIndex nur an Wörter', () => {
    const tokens = tokenize('Hund und Katze');
    const words = tokens.filter((t) => t.isWord);
    expect(words.map((t) => t.wordIndex)).toEqual([0, 1, 2]);
    expect(tokens.filter((t) => !t.isWord).every((t) => t.wordIndex === null)).toBe(true);
  });

  it('behandelt Satzzeichen als Nicht-Wort-Tokens', () => {
    const tokens = tokenize('Hallo, Welt!');
    expect(tokens.map((t) => t.text)).toEqual(['Hallo', ', ', 'Welt', '!']);
    expect(tokens.filter((t) => t.isWord).map((t) => t.text)).toEqual(['Hallo', 'Welt']);
  });

  it('erkennt deutsche Umlaute und ß als Wortzeichen', () => {
    const tokens = tokenize('Größe Straße Übung');
    expect(tokens.filter((t) => t.isWord).map((t) => t.text)).toEqual(['Größe', 'Straße', 'Übung']);
  });

  it('zählt Ziffern als Wortzeichen', () => {
    const tokens = tokenize('Zimmer 101 frei');
    expect(tokens.filter((t) => t.isWord).map((t) => t.text)).toEqual(['Zimmer', '101', 'frei']);
  });

  it('reproduziert den Originaltext beim Zusammenfügen verlustfrei', () => {
    const text = '  Mehrere   Leerzeichen, und\nZeilen!  ';
    expect(
      tokenize(text)
        .map((t) => t.text)
        .join('')
    ).toBe(text);
  });

  it('liefert leeres Array für leeren Text', () => {
    expect(tokenize('')).toEqual([]);
  });

  it('wordCount stimmt mit der Anzahl Wort-Tokens überein', () => {
    expect(wordCount('Hund und Katze')).toBe(3);
    expect(wordCount('Hallo, Welt!')).toBe(2);
    expect(wordCount('')).toBe(0);
    expect(wordCount('   ,. !')).toBe(0);
  });
});
