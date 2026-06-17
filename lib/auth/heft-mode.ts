import 'server-only';
import { getStudentIdentityById } from '@/lib/db/student-login';

// Single Source of Truth: Welches Heft hat diese Schüler:in? (ADR-0015)
//   - 'word'   → SSO-Schüler:in (o365Email gesetzt): Word-Heft via OneDrive-Link
//   - 'tiptap' → Code+PIN-Schüler:in: eingebautes Tiptap-Heft unter /s/heft
// Vorher prüften Layout, Themen-Seite und Header das jeweils selbst
// (HEFT-CRIT-1: Doppel-Link im Header für SSO) — jetzt EIN Helper.

export type HeftMode = 'word' | 'tiptap';

export async function getHeftMode(studentCodeId: string): Promise<HeftMode> {
  const identity = await getStudentIdentityById(studentCodeId);
  return identity?.o365Email ? 'word' : 'tiptap';
}
