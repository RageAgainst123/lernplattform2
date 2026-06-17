import 'server-only';

// Pexels-API-Wrapper für den Heft-Bild-Picker (Phase H2).
//
// Sicherheits-Modell:
//   - Aufruf NUR vom Server (via Server Action). API-Key ist PEXELS_API_KEY
//     in process.env, landet nie im Client-Bundle.
//   - Schüler:in tippt eine Suchanfrage → Server Action ruft searchPexelsImages
//     → liefert Bild-Stubs zurück → Client zeigt Grid + erlaubt Auswahl.
//
// Performance:
//   - In-Memory-Cache pro Server-Instanz (5 Min TTL). Identische Suchen
//     einer Klasse („tastatur") treffen den Cache. Bei Serverless-Restart
//     leer — egal, ist nur Cache, keine Korrektheits-Garantie.
//   - Default 12 Bilder pro Anfrage (3×4 oder 4×3 Grid).
//
// Quelle: https://www.pexels.com/api/documentation/

export type PexelsImage = {
  id: number;
  thumbnail: string; // src.medium für die Picker-Grid-Vorschau
  full: string; // src.large für den Editor-Embed
  alt: string;
  photographer: string;
  photographerUrl: string;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
type CacheEntry = { at: number; images: PexelsImage[] };
const cache = new Map<string, CacheEntry>();

// Roh-Antwort-Typ (nur die Felder die uns interessieren)
type PexelsApiPhoto = {
  id: number;
  alt?: string | null;
  photographer: string;
  photographer_url: string;
  src: { medium: string; large: string };
};

type PexelsApiResponse = {
  photos: PexelsApiPhoto[];
};

function cacheKey(query: string, perPage: number): string {
  return `${query.toLowerCase().trim()}|${perPage}`;
}

function fromCache(key: string): PexelsImage[] | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.at + CACHE_TTL_MS < nowMs()) {
    cache.delete(key);
    return null;
  }
  return hit.images;
}

// Date.now-Wrapper isoliert — für Tests könnte man später mocken.
function nowMs(): number {
  return Date.now();
}

function mapPhoto(p: PexelsApiPhoto): PexelsImage {
  return {
    id: p.id,
    thumbnail: p.src.medium,
    full: p.src.large,
    alt: p.alt ?? '',
    photographer: p.photographer,
    photographerUrl: p.photographer_url,
  };
}

// Hauptfunktion. Liefert `perPage` Bilder zur Suchanfrage. Wirft bei
// fehlendem API-Key oder Rate-Limit (429) — Caller sollte das in UI als
// nutzerfreundliche Meldung zeigen.
export async function searchPexelsImages(query: string, perPage = 12): Promise<PexelsImage[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    throw new Error('PEXELS_API_KEY ist nicht gesetzt — siehe .env.example.');
  }

  const key = cacheKey(cleanQuery, perPage);
  const cached = fromCache(key);
  if (cached) return cached;

  const url = new URL('https://api.pexels.com/v1/search');
  url.searchParams.set('query', cleanQuery);
  url.searchParams.set('per_page', String(perPage));
  url.searchParams.set('locale', 'de-DE');

  const res = await fetch(url.toString(), {
    headers: { Authorization: apiKey },
    // Next.js-fetch-Cache deaktivieren — eigener TTL-Cache reicht
    cache: 'no-store',
  });

  if (res.status === 429) {
    throw new Error('Pexels-Limit erreicht. Bitte in ein paar Minuten erneut versuchen.');
  }
  if (!res.ok) {
    throw new Error(`Pexels-API-Fehler: ${res.status}`);
  }

  const data = (await res.json()) as PexelsApiResponse;
  const images = (data.photos ?? []).map(mapPhoto);
  cache.set(key, { at: nowMs(), images });
  return images;
}
