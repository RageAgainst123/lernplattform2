'use server';

import 'server-only';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { createServiceClient } from '@/lib/supabase/admin';
import { searchPexelsImages } from '@/lib/pexels';
import type { PexelsSearchResult } from '@/lib/db/pexels-action';

// Server-Actions für den Hotspot-Bild-Editor (Admin-Bereich). Anders als die
// Schüler:innen-Variante in pexels-action.ts verlangen diese requireAdmin —
// der Editor läuft im /admin-Bereich.

const STORAGE_BUCKET = 'materials';
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// Lädt ein Bild in den materials-Bucket (Unterordner hotspots/) und gibt die
// öffentliche URL zurück. Wiederverwendet das Upload-Muster aus
// material-actions.ts, aber ohne materials-DB-Eintrag (das Bild lebt nur als
// imageUrl im Modul-content).
export async function uploadHotspotImage(file: File): Promise<{ url: string }> {
  await requireAdmin();
  if (!file || file.size === 0) throw new Error('Bitte ein Bild auswählen.');
  if (!file.type.startsWith('image/')) throw new Error('Nur Bilddateien sind erlaubt.');
  if (file.size > MAX_BYTES) throw new Error('Bild ist zu groß (max. 5 MB).');

  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]/g, '-');
  const path = `hotspots/${Date.now()}-${safeName}`;
  const svc = createServiceClient();
  const { error } = await svc.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error('Bild-Upload fehlgeschlagen: ' + error.message);

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return { url: `${base}/storage/v1/object/public/${STORAGE_BUCKET}/${path}` };
}

// Pexels-Suche für den Hotspot-Editor (Admin). Spiegelt searchImagesAction,
// aber mit Admin-Guard statt Schüler:innen-Session.
export async function searchHotspotImages(query: string): Promise<PexelsSearchResult> {
  await requireAdmin();
  try {
    const images = await searchPexelsImages(query, 12);
    return { ok: true, images };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Suche fehlgeschlagen.' };
  }
}
