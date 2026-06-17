import type { ValidationStatus } from '@/lib/schemas/entities';

// Phase Q: server-side HEAD-Request gegen die OneDrive-URL.
//
// EHRLICH: wir können von außen ohne Microsoft-Login-Cookie kaum zuverlässig
// sagen ob ein Link funktioniert. Microsoft redirected oft zu login.live.com
// (HTTP 302/200 auf der Login-Seite) oder gibt 403 zurück wenn die Permission
// auf "Personen in deiner Organisation" steht — das heißt aber NICHT dass der
// Link kaputt ist, sondern nur dass UNSER anonymer Server nicht reinkommt.
//
// Strategie:
//   - 404 → 'broken' (Datei existiert nicht)
//   - finale URL auf login.microsoftonline.com / login.live.com → 'unverified'
//   - 200 ohne Login-Redirect → 'ok'
//   - 401/403/302/sonst → 'unverified'
//
// Wir wollen lieber "ℹ️ gespeichert" zeigen als fälschlich "⚠️ kaputt" wenn
// der Link für eine eingeloggte Lehrer:in eigentlich funktioniert.
//
// Eigene Datei (nicht in word-heft-actions.ts) weil dort 'use server' steht
// und außer Server-Actions nichts exportiert werden darf — testbar bleibt
// die Probe-Logik nur als isolierte Funktion.

const PROBE_TIMEOUT_MS = 5000;
const MS_LOGIN_HOSTS = ['login.microsoftonline.com', 'login.live.com'];

export async function probeOneDriveUrl(url: string): Promise<ValidationStatus> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    // 404 ist hartes "Datei weg" → wirklich broken
    if (response.status === 404) return 'broken';
    // Wenn finale URL ein MS-Login-Endpunkt ist → org-only-Link, wir kommen
    // ohne Auth nicht rein. Lehrer:in mit MS-Login schon. → unverified.
    const finalUrl = response.url.toLowerCase();
    if (MS_LOGIN_HOSTS.some((host) => finalUrl.includes(host))) {
      return 'unverified';
    }
    // 200 ohne Login-Redirect → wirklich öffentlich erreichbar
    if (response.ok) return 'ok';
    // 401/403/302/sonst → wir kommen ohne Login nicht rein, sagt nichts über
    // tatsächliche Erreichbarkeit für die Lehrer:in. Lieber 'unverified'
    // als fälschlich 'broken'.
    return 'unverified';
  } catch {
    // Netzwerk-Fehler, Timeout, CORS-Block etc. → unverified, nicht broken.
    return 'unverified';
  }
}
