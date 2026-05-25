# ADR-0003: shadcn/ui mit Base UI (base-nova-Preset)

**Status:** accepted
**Datum:** 2026-05-25

## Kontext

`shadcn init` (CLI v4) bietet mehrere Presets. Der Default `--defaults` nutzt das
Preset `base-nova`, das auf **Base UI** (`@base-ui/react`) statt der klassischen
Radix-Primitives aufbaut. Base-Farbe: neutral (laut Manifest).

## Entschieden

base-nova / Base UI als Komponenten-Fundament, Base-Farbe `neutral`, Tailwind v4
(CSS-`@theme`, keine `tailwind.config.js`).

## Verworfen

- **Radix-Preset** — der klassische shadcn-Stack, aber nicht mehr der CLI-Default;
  Base UI ist der eingeschlagene Weg von shadcn.

## Konsequenzen

- Es gibt **keine `form`-Komponente** mehr; Ersatz ist `field` (layout-orientiert),
  Formular-State via react-hook-form + Zod separat verdrahtet.
- `shadcn` braucht keine lokale Dependency — läuft via `pnpm dlx shadcn@latest add …`.
- Der von `init` erzeugte `@import 'shadcn/tailwind.css'` ist defekt (Datei fehlt
  im npm-Paket) und wurde aus `globals.css` entfernt; Komponenten rendern korrekt
  über `@import 'tailwindcss'` + `tw-animate-css` + Theme-Tokens.
- `components/ui/**` ist von den ESLint-Projekt-Limits ausgenommen (CLI-verwaltet).
