import { randomInt } from 'node:crypto';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

// Erzeugt eine zufällige vierstellige PIN (0000–9999, führende Nullen erlaubt).
// randomInt aus node:crypto ist kryptografisch sicher (nicht Math.random).
export function generatePin(): string {
  return String(randomInt(0, 10000)).padStart(4, '0');
}

// Hasht eine PIN mit bcrypt. Der Hash wird in student_codes.pin_hash gespeichert,
// die Klartext-PIN wird nie persistiert (PLATTFORM_MANIFEST Hard Rule #10).
export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, SALT_ROUNDS);
}

// Prüft eine eingegebene PIN gegen den gespeicherten Hash (Schüler:innen-Login).
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}
