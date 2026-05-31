# Design-System der Lernplattform DGB

> Verbindliche Referenz für Farben, Spacing, Typografie und Layout-Bausteine
> der Plattform. Gilt für Web (Schüler:innen-/Lehrer:innen-/Admin-UI)
> **und** für druckbare Arbeitsblätter (PDF).
> Stand: 2026-05-30.

## 1. Quellen der Wahrheit

| Schicht                                                | Quelle                                                                                       | Anwendung                                                          |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **TS/JS-Code** (Server, Komponenten, react-pdf, Email) | [`lib/brand.ts`](../lib/brand.ts) — `COLORS`, `SPACING`, `TYPE`, `RADIUS`                    | Inline-Styles, dynamische Klassen, JS-erzeugte Inhalte             |
| **CSS / Tailwind v4**                                  | [`app/globals.css`](../app/globals.css) — `@theme inline` mit `--primary`, `--background`, … | Alle Tailwind-Utilities (`bg-primary`, `text-muted-foreground`, …) |
| **Python (reportlab) für PDFs**                        | [`arbeitsblaetter/_design_tokens.py`](../arbeitsblaetter/_design_tokens.py)                  | Generator-Skripte (`arbeitsblaetter/gen_*.py`)                     |

**Regel:** Wenn ein Token (Farbe, Größe, Spacing) geändert wird, müssen
**alle drei Quellen** synchron aktualisiert werden. Die Hex-/Wert-Tabelle
unten ist der gemeinsame Vertrag.

Siehe [`docs/adr/0010-design-tokens-zwei-quellen.md`](adr/0010-design-tokens-zwei-quellen.md)
für die Architektur-Begründung.

## 2. Farb-Palette

| Token           | Hex       | Verwendung                                 |
| --------------- | --------- | ------------------------------------------ |
| `primary`       | `#2563eb` | Akzent, CTA-Buttons, Links, ProgressBar    |
| `primaryLight`  | `#eff6ff` | Hintergrund für Banner, Infobox-Background |
| `primaryBorder` | `#bfdbfe` | Rahmen um Akzent-Boxen                     |
| `text`          | `#0f172a` | Standard-Textfarbe                         |
| `textMuted`     | `#64748b` | Untertitel, Labels                         |
| `textLight`     | `#94a3b8` | Captions, Hinweise                         |
| `background`    | `#ffffff` | Page-Background                            |
| `surface`       | `#f8fafc` | Karten-Hintergrund, Code-Blöcke            |
| `border`        | `#e2e8f0` | Trennlinien, Karten-Rahmen                 |
| `success`       | `#16a34a` | „Richtig!"-Feedback                        |
| `warning`       | `#ca8a04` | „Speichern fehlgeschlagen", Hinweise       |
| `error`         | `#dc2626` | „Falsch", Validierungs-Fehler              |

**Branding-Bezug:** das primäre Akzentblau (`#2563eb`) ist Tailwind
„blue-600" und der dezenteste klassische Schul-Blau-Ton — wirkt vertraut,
nicht kalt. **Bei Logo-/Brand-Update** wird dieser Wert in allen drei
Quellen ausgetauscht.

## 3. Spacing

Web (Pixel) — Tailwind-Skala:

| Token | Web px | Verwendung                           |
| ----- | ------ | ------------------------------------ |
| `xs`  | 4      | Eng zusammenhängende Inline-Elemente |
| `sm`  | 8      | Innere Abstände kleiner Elemente     |
| `md`  | 12     | Standard-Padding                     |
| `lg`  | 16     | Karten-Padding, Section-Abstand      |
| `xl`  | 24     | Großer Block-Abstand                 |
| `xxl` | 32     | Page-Section-Übergänge               |

PDF (Millimeter) — direkt druckwirksam:

| Token       | PDF mm |
| ----------- | ------ |
| `SPACE_XS`  | 1.5    |
| `SPACE_SM`  | 3      |
| `SPACE_MD`  | 5      |
| `SPACE_LG`  | 8      |
| `SPACE_XL`  | 12     |
| `SPACE_XXL` | 18     |

## 4. Typografie

| Token   | Web px | PDF pt | Verwendung                        |
| ------- | ------ | ------ | --------------------------------- |
| `h1`    | 28     | 22     | Hauptüberschrift (eine pro Seite) |
| `h2`    | 20     | 15     | Sektion / Aufgabe                 |
| `h3`    | 16     | 13     | Unterabschnitt                    |
| `body`  | 14     | 11     | Fließtext                         |
| `small` | 12     | 9      | Untertitel, Captions              |
| `micro` | 10     | 8      | Footer, Lehrplan-Marker           |

**Fonts:**

- **Web:** System-Stack (ADR-0004) — `-apple-system`, `BlinkMacSystemFont`,
  „Segoe UI", …
- **PDF:** Helvetica (reportlab-Standard, kostenlos, visuell nah am
  System-Stack).

## 5. Border-Radius

| Token | Web px |
| ----- | ------ |
| `sm`  | 4      |
| `md`  | 8      |
| `lg`  | 12     |

PDF-reportlab-Layout nutzt keine Rundungen direkt (Tabellen sind eckig);
gerundete Optik kommt nur über Box-Schatten und Linien zustande.

## 6. Layout-Bausteine im PDF

Die PDF-Bausteine leben in [`arbeitsblaetter/_styles.py`](../arbeitsblaetter/_styles.py).
Jedes Generator-Skript (`gen_*.py`) komponiert nur noch aus diesen
Bausteinen — KEINE eigenen Farben oder Spacing-Werte mehr.

| Helper                                         | Was es macht                                                           |
| ---------------------------------------------- | ---------------------------------------------------------------------- |
| `header(title, subtitle)`                      | Titelzeile + dezenter Untertitel mit „Digitale Grundbildung · X. SSt." |
| `lernziele_box(items)`                         | Akzent-Box mit „Nach diesem Arbeitsblatt kannst du …" + Bullet-Liste   |
| `theorie_box(text)`                            | Akzent-Box für Theorie-Erklärung                                       |
| `merksatz_box(title, text)`                    | Box mit Titel und Text — entspricht der Web-Infobox                    |
| `aufgabe_header(nr, titel)`                    | „Aufgabe N · Titel" als H2                                             |
| `mc_checkboxes(question, options)`             | Multiple-Choice mit Kästchen zum Ankreuzen                             |
| `wf_choices(question)`                         | „Wahr ☐ Falsch ☐"-Zeile                                                |
| `lueckentext_lines(intro, n_lines=1)`          | Intro + n Schreiblinien für Lückentext-Antworten                       |
| `write_lines(n)`                               | n nackte Schreiblinien                                                 |
| `match_table(question, pairs, categories)`     | Tabelle für Zuordnungsaufgaben                                         |
| `reflexion_lines(prompt, n_lines=4)`           | Prompt + n Schreiblinien für offene Reflexion                          |
| `footer_lehrplan(stufe, bereich, kompetenzen)` | Untere Footer-Zeile mit Lehrplan-Marker                                |
| `make_doc(out_path)` · `vspace(mm)`            | Dokument-Setup bzw. vertikaler Abstand                                 |

## 7. Wortmarke + Logo (Platzhalter)

- **Wortmarke:** `BRAND.name` (Web) bzw. via Konstante (PDF). Aktuell
  „DGB Austria" als Platzhalter. Wird bei finaler Brand-Entscheidung
  ein-Stellen-getauscht.
- **Bildmarke:** im Web als Lucide-Icon (`Logo.tsx`), im PDF aktuell **kein**
  Bild — nur Wortmarke. Bei Logo-Datei einsetzen → `header()` in `_styles.py`
  um `Image()` erweitern, im Web `components/site/Logo.tsx` das Icon
  ersetzen.

## 8. Änderungsregeln (kurz und verbindlich)

1. **Ein Token-Wert ändert sich nie isoliert.** Wenn `primary` wechselt:
   `lib/brand.ts` + `app/globals.css` (Tailwind-Theme) + `_design_tokens.py`
   gleichzeitig.
2. **Doku gewinnt im Zweifel:** Diese Markdown-Tabelle ist die Referenz für
   Reviews. Code-Werte müssen ihr entsprechen.
3. **Neue Tokens nur per ADR** (ergänzendes Kapitel in ADR-0010 oder neuer
   ADR). Damit wir keinen Token-Wildwuchs bekommen.
4. **Komponenten-Bausteine** in `_styles.py` werden additiv erweitert —
   nie gelöscht (sonst brechen bestehende Generator-Skripte).

## 9. Querverweise

- [`lib/brand.ts`](../lib/brand.ts) — TS-Tokens
- [`app/globals.css`](../app/globals.css) — Tailwind-Theme
- [`arbeitsblaetter/_design_tokens.py`](../arbeitsblaetter/_design_tokens.py) — Python-Tokens
- [`arbeitsblaetter/_styles.py`](../arbeitsblaetter/_styles.py) — PDF-Bausteine
- [`docs/adr/0010-design-tokens-zwei-quellen.md`](adr/0010-design-tokens-zwei-quellen.md) — Architektur-Entscheidung
- [`docs/AUTOR-WORKFLOW.md`](AUTOR-WORKFLOW.md) — wie Geo neue Module/PDFs baut
