# ADR-0001: @supabase/ssr statt @supabase/auth-helpers

**Status:** accepted
**Datum:** 2026-05-25

## Kontext

Für Lehrer:innen-Auth brauchen wir server-seitige Sessions mit HTTP-Only-Cookies
in Next.js (App Router). Supabase bietet historisch zwei Wege: das ältere
`@supabase/auth-helpers-nextjs` und das neuere `@supabase/ssr`.

## Entschieden

`@supabase/ssr` mit `createBrowserClient` / `createServerClient` und dem
`getAll`/`setAll`-Cookie-Pattern.

## Verworfen

- **@supabase/auth-helpers-\*** — von Supabase offiziell deprecated; würde bei
  künftigen Updates brechen.

## Konsequenzen

- `cookies()` ist in Next.js 16 asynchron → muss awaited werden (`lib/supabase/server.ts`).
- Drei dünne Wrapper: `client.ts` (Browser), `server.ts` (Server Components/Actions),
  `middleware.ts` (Token-Refresh, aufgerufen aus `proxy.ts`).
- In Server Components nur `getUser()` (validiert JWT), nie `getSession()`.
