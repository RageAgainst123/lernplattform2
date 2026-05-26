import { randomInt } from 'node:crypto';

// Zeichensatz für Klassen-Beitrittscodes ohne leicht verwechselbare Zeichen
// (kein 0/O, 1/I/L). Großbuchstaben + Ziffern, gut auf Papier lesbar.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

// Erzeugt einen zufälligen Beitrittscode (z. B. "K7M2X9"). randomInt aus
// node:crypto ist kryptografisch sicher.
export function generateJoinCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return code;
}

// Normalisiert eine Nutzereingabe (Schüler:in tippt den Code) für den Vergleich:
// trimmen, Großbuchstaben, Leerzeichen/Bindestriche entfernen.
export function normalizeJoinCode(input: string): string {
  return input.trim().toUpperCase().replace(/[\s-]/g, '');
}
