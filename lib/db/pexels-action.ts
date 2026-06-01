'use server';

import 'server-only';
import { requireStudentSession } from '@/lib/auth/student-auth';
import { searchPexelsImages, type PexelsImage } from '@/lib/pexels';

// Server Action für den Bild-Picker (Phase H2). Nur eingeloggte
// Schüler:innen dürfen suchen — der requireStudentSession-Check verhindert
// dass der API-Key öffentlich missbraucht werden kann (sonst könnte jeder
// die Lernplattform als Pexels-Proxy ohne eigenes Limit nutzen).
//
// Liefert ein Result-Objekt statt zu throwen — der Picker-Dialog will
// die Fehlermeldung inline zeigen, kein Boundary-Crash.

export type PexelsSearchResult = { ok: true; images: PexelsImage[] } | { ok: false; error: string };

export async function searchImagesAction(query: string): Promise<PexelsSearchResult> {
  await requireStudentSession();
  try {
    const images = await searchPexelsImages(query, 12);
    return { ok: true, images };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Suche fehlgeschlagen.' };
  }
}
