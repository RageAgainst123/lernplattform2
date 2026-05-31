# ADR-0009: Open-Redirect-Schutz im Magic-Link-Callback

**Status:** accepted (am 2026-05-30 gehärtet — reiner String-Check war umgehbar)
**Datum:** 2026-05-29

> **Nachtrag 2026-05-30:** Der ursprüngliche reine String-Check (`startsWith('/')`
>
> - `!startsWith('//')`) war **umgehbar**: `/\evil.com` beginnt mit einem einzelnen
>   `/`, wird aber von Browsern/WHATWG-URL zu `//evil.com` normalisiert und löst zu
>   `https://evil.com` auf (auch `/<tab>/evil.com` u. ä.). `safeNext()` verbietet jetzt
>   zusätzlich Backslashes + Control-Chars und führt die unten als „Overkill"
>   verworfene **URL-Origin-Prüfung** doch aus (Auflösen gegen Dummy-Origin, Host-
>   Wechsel = Fallback). 5 neue Test-Vektoren. Lehre: bei Redirect-Validierung
>   nie auf String-Heuristik allein verlassen — immer gegen den echten URL-Parser.

## Kontext

Der Magic-Link-Callback (`app/auth/confirm/route.ts`) liest einen
`next`-Parameter aus der URL und leitet die Lehrer:in nach erfolgreichem
Login dorthin. Der Wert war bis Phase 14 ohne Validierung in
`new URL(next, request.url)` gepackt und als Redirect-Ziel verwendet.

Damit war ein klassischer Open-Redirect möglich:

- `?next=https://evil.com` — absolute URL: `new URL()` akzeptiert das.
- `?next=//evil.com` — protokoll-relative URL: beginnt mit `/`, ist aber
  vom Browser als externes Ziel interpretiert.
- `?next=javascript:alert(1)` — JS-Schema. `redirect()` lässt das fallen,
  aber der Pattern ist trotzdem hässlich.

Ein Angreifer kann einen Magic-Link mit präpariertem `next`-Param via
E-Mail/Slack/QR-Code verteilen. Die Empfänger:in sieht eine vertrauenswürdige
Domain (`https://dgb-austria.at/auth/confirm?...`), wird nach dem Login auf
`evil.com` umgeleitet und dort ggf. zur Eingabe von Credentials verleitet.

## Entschieden

**Whitelist-basierte Validierung:** der `next`-Param wird durch eine
Pure-Helper-Funktion `safeNext()` geschickt, die nur **relative App-interne
Pfade** durchlässt — alles andere fällt auf `/lehrer` zurück.

```typescript
export function safeNext(raw: string | null): string {
  if (!raw) return '/lehrer';
  if (!raw.startsWith('/')) return '/lehrer'; // absolute URL
  if (raw.startsWith('//')) return '/lehrer'; // protokoll-relativ
  return raw;
}
```

Beide Checks sind nötig — `startsWith('/')` allein lässt `//evil.com`
durch, weil das technisch ein „Pfad" ist.

Die Funktion ist in derselben Datei wie die Route — klein genug, kein
eigenes Modul. Tests in `app/auth/confirm/route.test.ts`.

## Verworfen

- **Domain-Allowlist** (`evil.com` blocken) — kommt nie hinterher; falsche
  Default-Sicherheit (Block-List statt Allow-List).
- **`next`-Param ignorieren** — würde UX kaputtmachen: nach Login von
  `/admin/material/[id]` → `/auth/confirm` → wieder `/lehrer`-Dashboard statt
  zurück zur Quelle.
- **`URL`-Constructor mit Origin-Vergleich** (`new URL(next, origin).origin
=== origin`) — funktioniert, aber `safeNext` ist robuster (kein
  zusätzlicher Constructor-Overhead, klare Pattern-Whitelist).
- **`encodeURIComponent`-Wrapping** — würde nicht helfen, der Angreifer
  kontrolliert ohnehin den Input.

## Konsequenzen

- **`safeNext()` muss eine Pure-Funktion bleiben** — leicht testbar, kein
  IO. Die Tests stellen 10 Fälle ab (null, leer, normal, mit Query/Hash,
  https, http, `//`, `//x/y`, ohne Slash, `javascript:`).
- **Folgekosten in zukünftigen Routen:** wenn andere Server-Actions oder
  Routen-Handler später ähnliche User-kontrollierte Redirect-Ziele bekommen,
  müssen sie `safeNext()` (oder ein analoges Pattern) verwenden. Wird in
  `CLAUDE.md` als Stolperfalle dokumentiert.
- **Keine Auswirkung auf das Datenmodell.** Keine Migration nötig.
- **Falls echte externe Redirects später nötig werden** (z. B. SSO-Login
  zu einem Partner), muss eine explizite Allowlist `EXTERNAL_NEXT_HOSTS`
  in `lib/brand.ts` ergänzt und `safeNext` erweitert werden — NICHT die
  Validierung gelockert.

## Querverweise

- [`app/auth/confirm/route.ts`](../../app/auth/confirm/route.ts)
- [`app/auth/confirm/route.test.ts`](../../app/auth/confirm/route.test.ts)
- [OWASP: Unvalidated Redirects and
  Forwards](https://owasp.org/www-community/attacks/Unvalidated_Redirects_and_Forwards_Cheat_Sheet)
- [Phase 14 Doppel-Login-Fix](./0008-rollenabhaengiger-header-link.md) —
  derselbe Sicherheits-Sprint
