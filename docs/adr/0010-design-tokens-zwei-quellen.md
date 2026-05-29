# ADR-0010: Design-Tokens in zwei spiegelnden Quellen (TS + Python)

**Status:** accepted
**Datum:** 2026-05-29

## Kontext

Die Plattform hat zwei sehr unterschiedliche Render-Pfade:

- **Web** (Next.js / Tailwind v4 / React): Komponenten nutzen CSS-
  Variablen aus `app/globals.css` (`@theme inline`) sowie TS-Konstanten
  aus `lib/brand.ts`.
- **Druckbare Arbeitsblätter** (Python / reportlab): Generator-Skripte
  in `arbeitsblaetter/gen_*.py` erzeugen PDFs.

Beide müssen **identisch aussehen** (Farben, Spacing, Typografie-
Hierarchie), damit Schüler:innen das Online-Modul und das ausgedruckte
Arbeitsblatt als zusammenhängend wahrnehmen. Logo + Wortmarke sind
aktuell Platzhalter („DGB Austria") — bei späterem Brand-Update muss der
Tausch reibungslos beide Pfade erreichen.

Wir können in Python nicht direkt aus `lib/brand.ts` importieren — die
Sprachen sind getrennt. Eine generische Lösung wie „Tokens in JSON
auslagern, beide Sprachen importieren JSON" klingt sauber, hat aber
versteckte Kosten:

- TS-Strict-Mode mag JSON-Imports nur mit Type-Cast.
- reportlab will Hex-Strings → JSON-Werte müssten zur Laufzeit gewrappt
  werden (`HexColor(json_value)`) — eine zusätzliche Indirektion ohne
  Mehrwert.
- ein Wechsel-Token (`primary: '#2563eb'` → `'#15803d'`) ist in beiden
  Sprachen ein One-Liner; ein Build-Step der JSON in TS-Konstanten/Python-
  Konstanten generiert wäre Over-Engineering.

## Entschieden

**Zwei spiegelnde Quellen** + **eine verbindliche Doku**:

- **`lib/brand.ts`** — TS-Konstanten `COLORS`, `SPACING`, `TYPE`, `RADIUS`.
  Quelle für JS-/Server-Code, react-pdf, Email-Templates, dynamische
  Inline-Styles.
- **`arbeitsblaetter/_design_tokens.py`** — die exakt gleichen Werte als
  Python-Konstanten (`PRIMARY`, `SPACE_LG`, `FONT_H1`, …). Quelle für
  reportlab-PDF-Skripte.
- **`docs/DESIGN-SYSTEM.md`** — Tabellen aller Tokens als verbindlicher
  Vertrag. Bei Reviews ist diese Doku die Wahrheit.

Tailwind v4 `@theme inline` in `app/globals.css` bleibt parallel die CSS-
Variable-Quelle (für `bg-primary`-Utilities etc.). Hex-Werte dort sind
identisch.

## Verworfen

- **Eine gemeinsame JSON-Datei** (`design-tokens.json`) als Single Source:
  Mehrarbeit beim Import in TS-Strict (Type-Cast), reportlab muss die
  Strings ohnehin in `HexColor()` wrappen. Keine echte Vereinfachung.
- **Alles in CSS, Python via CSS-Parser:** zu fragil; CSS-Variablen-
  Parsen in Python ist nicht standardisiert.
- **Eine Code-Generierung via Build-Step:** würde funktionieren (z. B.
  `tokens.json` → `lib/brand-tokens.ts` + `_design_tokens.py`), bringt
  aber CI-Komplexität für ein Single-User-Tool. Erst sinnvoll wenn 10+
  Mitarbeiter:innen Tokens ändern.
- **Nur in einer Sprache halten** (z. B. nur TS, PDF via react-pdf):
  würde den bewährten Python-Workflow (reportlab) brechen, den der
  Autor:in explizit will (Geo: „so wie beim EVA-Arbeitsblatt").

## Konsequenzen

- **Doku-Pflicht:** Wer einen Token ändert, muss DREI Stellen aktualisieren
  (`lib/brand.ts`, `app/globals.css`, `_design_tokens.py`) UND einmal
  `docs/DESIGN-SYSTEM.md` bei Bedarf. Wird als CLAUDE.md-Stolperfalle
  vermerkt.
- **Risiko Drift:** wenn jemand vergisst, eine Stelle zu aktualisieren,
  weicht das PDF-Layout vom Web-Layout ab. Mitigation: die drei Dateien
  sind alle klein und kommentiert; der Doku-Sweep-Workflow (CLAUDE.md)
  macht das sichtbar.
- **Wachstum:** Wenn die Plattform mehr-Brand-fähig wird (verschiedene
  Bundesländer, andere Schulen), hebt diese Entscheidung sich auf — dann
  Token-Tabelle in DB + dynamisches Theme. Heute völlig OK.
- **Wortmarke + Logo-Tausch** ist trivial: `BRAND.name` (TS) bleibt der
  Anker für Texte; Logo-Bild → `Logo.tsx` (Web) + `_styles.py.header()`
  (PDF). Keine Token-Frage.

## Querverweise

- [`docs/DESIGN-SYSTEM.md`](../DESIGN-SYSTEM.md) — Token-Tabellen, verbindlich
- [`lib/brand.ts`](../../lib/brand.ts)
- [`arbeitsblaetter/_design_tokens.py`](../../arbeitsblaetter/_design_tokens.py)
- [`app/globals.css`](../../app/globals.css)
- [ADR-0004 System-Fonts statt Google](0004-system-fonts-statt-google.md)
