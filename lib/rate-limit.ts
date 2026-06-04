// In-Memory Rate-Limiter pro IP (Pre-Launch-C6, COST-CONTROLS.md L1.4).
//
// Zweck: Bot-Schutz + Schutz gegen versehentliche Client-Endlos-Schleifen
// (z.B. Polling-Hook der nicht aufhört nach Component-Unmount). Verhindert
// dass eine einzelne IP die Polling-Endpoints (1s-Tick × hunderte Schüler)
// in Function-Limits sprengt.
//
// Implementierung: simple sliding-window in Map. Vercel-Edge-Instanzen
// halten EIGENE Map — bei mehreren Instanzen zählt jede separat. Das ist
// suboptimal für stringentes Rate-Limiting, aber für Bot-Schutz völlig ok
// (eine einzelne Instanz blockiert Bots schon zuverlässig).
//
// Pattern: 100 Requests pro Minute pro IP. Bei Überschreitung: 429
// Too Many Requests. Reset rolliert (alte Einträge verfallen).
//
// Nicht für Schwellen-Lasttest geeignet — dort vorübergehend
// RATE_LIMIT_DISABLED=true setzen.

const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 100;

type Bucket = {
  count: number;
  windowStart: number; // ms timestamp
};

// Module-scope: persistiert über requests im selben Edge-Container.
const buckets = new Map<string, Bucket>();

// Periodische Aufräumung um Memory-Leak bei vielen einmaligen IPs zu
// verhindern. Lazy: jedes 1000. checkRate-Aufruf prüft + räumt auf.
let opCount = 0;
const CLEANUP_EVERY = 1000;

function cleanup(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > WINDOW_MS) {
      buckets.delete(key);
    }
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number; // ms timestamp wann das Window endet
};

// Hauptfunktion: prüft + erhöht in einem Schritt. Race-frei innerhalb
// einer Node.js-Instance (single-threaded event loop).
export function checkRate(key: string, now: number = Date.now()): RateLimitResult {
  if (process.env.RATE_LIMIT_DISABLED === 'true') {
    return { ok: true, remaining: MAX_PER_WINDOW, resetAt: now + WINDOW_MS };
  }

  opCount += 1;
  if (opCount % CLEANUP_EVERY === 0) cleanup(now);

  const bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    // Neues Window
    buckets.set(key, { count: 1, windowStart: now });
    return { ok: true, remaining: MAX_PER_WINDOW - 1, resetAt: now + WINDOW_MS };
  }
  bucket.count += 1;
  const ok = bucket.count <= MAX_PER_WINDOW;
  return {
    ok,
    remaining: Math.max(MAX_PER_WINDOW - bucket.count, 0),
    resetAt: bucket.windowStart + WINDOW_MS,
  };
}

// Extrahiert die Client-IP aus den Standard-Vercel-Headern. Fällt auf
// 'unknown' zurück wenn nichts gesetzt (lokal in dev).
export function ipFromRequest(request: Request): string {
  // Vercel setzt x-real-ip + x-forwarded-for. Cloudflare nutzt cf-connecting-ip.
  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

// Reset für Tests (vitest fresh-state).
export function _resetRateLimitForTests(): void {
  buckets.clear();
  opCount = 0;
}

// Convenience-Wrapper für API-Routen: nimmt Request + Prefix, prüft Rate,
// returnt entweder null (= ok, weiter) oder Response (= abgelehnt). Spart
// in jeder Route 6 Zeilen + reduziert Cyclomatic-Complexity.
//
// Usage:
//   const blocked = rateLimitGate(request, 'quiz-question');
//   if (blocked) return blocked;
export function rateLimitGate(request: Request, prefix: string): Response | null {
  const rate = checkRate(`${prefix}:${ipFromRequest(request)}`);
  if (rate.ok) return null;
  return new Response('Too many requests', {
    status: 429,
    headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' },
  });
}
