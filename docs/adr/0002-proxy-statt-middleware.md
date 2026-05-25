# ADR-0002: proxy.ts statt middleware.ts (Next.js 16)

**Status:** accepted
**Datum:** 2026-05-25

## Kontext

Der Supabase-Auth-Token-Refresh und der Routenschutz (`/lehrer` nur eingeloggt)
laufen vor dem Rendering. Die Standard-Supabase-Doku zeigt das in `middleware.ts`.
Next.js 16 hat die File-Convention `middleware` jedoch zu `proxy` umbenannt; ein
`middleware.ts` erzeugt beim Build eine Deprecation-Warnung.

## Entschieden

Die Logik liegt in `proxy.ts` im Repo-Root, exportiert eine Funktion `proxy`.
Die eigentliche Supabase-Logik bleibt im Helper `lib/supabase/middleware.ts`
(interner Name, kein Convention-Bezug) und wird von `proxy.ts` aufgerufen.

## Verworfen

- **middleware.ts beibehalten** — funktioniert noch, ist aber deprecated und
  würde in einer künftigen Next-Version entfernt.

## Konsequenzen

- Build ohne Deprecation-Warnung, „Proxy (Middleware)" im Build-Output.
- Beim Übernehmen von Supabase-Doku-Snippets muss `middleware.ts` → `proxy.ts`
  übersetzt werden.
- `config.matcher` schließt statische Assets aus.
