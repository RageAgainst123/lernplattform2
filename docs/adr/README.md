# Architecture Decision Records (ADRs)

Kurze Notizen zu wichtigen Architektur-Entscheidungen — pro Entscheidung eine
Markdown-Datei. Format nach Michael Nygard.

Zweck: Wenn in einer späteren Session jemand fragt „**Warum** haben wir das so
gebaut?", soll diese Antwort hier stehen, ohne die Recherche zu wiederholen.

## Format

```markdown
# ADR-XXXX: <Titel>

**Status:** accepted | superseded | proposed
**Datum:** YYYY-MM-DD

## Kontext

Was war das Problem? Welche Constraints standen im Raum?

## Entschieden

Welche Option, in einem Satz.

## Verworfen

Welche Alternativen, je ein Satz warum nicht.

## Konsequenzen

Was kostet/bringt die Entscheidung? Welche Folge-Entscheidungen hängen daran?
```

## Liste

| Nr                                               | Titel                                             | Datum      |
| ------------------------------------------------ | ------------------------------------------------- | ---------- |
| [0001](0001-supabase-ssr-statt-auth-helpers.md)  | @supabase/ssr statt @supabase/auth-helpers        | 2026-05-25 |
| [0002](0002-proxy-statt-middleware.md)           | proxy.ts statt middleware.ts (Next.js 16)         | 2026-05-25 |
| [0003](0003-shadcn-base-ui.md)                   | shadcn/ui mit Base UI (base-nova-Preset)          | 2026-05-25 |
| [0004](0004-system-fonts-statt-google.md)        | System-Fonts statt next/font/google               | 2026-05-25 |
| [0005](0005-keine-src-verzeichnis.md)            | Keine src/-Verzeichnisebene                       | 2026-05-25 |
| [0006](0006-display-modes-quiz-vs-worksheet.md)  | Display-Modes — Quiz vs. Worksheet pro Modul      | 2026-05-28 |
| [0007](0007-modul-status-drei-stufen.md)         | Modul-Status als 3-Stufen-Klassifizierung         | 2026-05-29 |
| [0008](0008-rollenabhaengiger-header-link.md)    | Rollenabhängiger Header-Nav-Link                  | 2026-05-29 |
| [0009](0009-open-redirect-schutz.md)             | Open-Redirect-Schutz im Magic-Link-Callback       | 2026-05-29 |
| [0010](0010-design-tokens-zwei-quellen.md)       | Design-Tokens in zwei spiegelnden Quellen         | 2026-05-29 |
| [0011](0011-bestehens-schwelle-pro-zuweisung.md) | Bestehens-Schwelle pro Zuweisung, nicht pro Modul | 2026-05-30 |
| [0012](0012-feedback-rueckgabe-zyklus.md)        | Lehrer:innen-Feedback & Rückgabe-Zyklus (ohne KI) | 2026-05-30 |
| [0013](0013-live-praesentation-polling.md)       | Live-Präsentation via Polling (kein Realtime)     | 2026-05-30 |
| [0014](0014-o365-sso-fuer-schueler-innen.md)     | O365-SSO für Schüler:innen, parallel zu Code+PIN  | 2026-06-02 |
