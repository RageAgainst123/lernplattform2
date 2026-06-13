# KI-Autoren-DX — Plan: Block-Erstellung & Modul-Erzeugung KI-tauglich machen

> **Zweck.** Dieses Dokument ist der **Architektur-Plan** dafür, wie wir die App
> so umbauen, dass eine KI/IDE (a) **neue Block-Typen** und (b) **neue Module**
> möglichst zuverlässig, einfach und ohne Drift bauen kann. Es ist eine
> Planungsgrundlage — Geo entscheidet pro Baustein, ob/wann wir ihn umsetzen.
> Status: 📋 geplant (2026-06-13). Gewählt: B1 Auto-Schema-Export, B2
> Self-Doc-Registry, B4 Eval-Harness.

## §0 Warum „KI-JSON-tauglich" heute schon funktioniert

Vier Eigenschaften machen die Welle-1-Blöcke gut KI-baubar. Wir wollen sie nicht
neu erfinden, sondern **systematisch absichern + verstärken**:

1. **Pure, geteilte Logik.** `word-search-grid.ts`, `scramble.ts`, … sind ohne
   React/DB testbar und werden von Schema-`superRefine`, Renderer, Editor-
   Vorschau UND `validate-module.mjs` geteilt → eine Wahrheit, kein Drift.
2. **Schema = Vertrag + Selbstvalidierung.** `superRefine` lehnt unlösbare/
   inkonsistente Inhalte schon beim Speichern ab → konkrete Fehlermeldung.
3. **`validate:module` = geschlossene Korrektur-Schleife.** Die KI iteriert
   ohne Menschen, bis grün.
4. **Determinismus.** Seeded statt `Math.random` → reproduzierbares Verhalten.

**Das größte Drift-Risiko:** Die KI lernt das Format heute aus
`MODUL-SPEZIFIKATION.md` — einer **handgepflegten Prosa-Doku**. Jeder neue
Block-Typ muss an ~7 Stellen manuell nachgezogen werden (Schema, evaluate,
Renderer, Form, Stub, Katalog, Allowlist, validate, Spec-Doku, Antwort-Format-
Tabelle). Wird einer vergessen, driftet die KI-Referenz vom Code ab. Die drei
gewählten Bausteine schließen genau diese Lücke.

---

## §1 Baustein B1 — Auto-Schema-Export (größter Hebel) ✅ GEBAUT (2026-06-13)

> **Status: umgesetzt.** `scripts/export-schema.mjs` + `pnpm export:schema`
> erzeugen `docs/generated/module-schema.json` (Draft 2020-12) und
> `docs/generated/block-fields.md` aus den Zod-Schemas. CI-Step
> `pnpm export:schema --check` + `lib/schemas/schema-export.test.ts` sichern
> gegen Drift; `docs/generated/` ist in `.prettierignore`, damit der
> `--check` nicht mit Prettier kollidiert. QUICKSTART + MODUL-SPEZIFIKATION
> verlinken die Artefakte.

### Problem

`MODUL-SPEZIFIKATION.md §3` ist von Hand gepflegt. Eine KI, die strikt danach
baut, kann durch eine veraltete Tabelle ein ungültiges Feld erzeugen.

### Lösung

Ein Skript `pnpm export:schema` leitet aus den **Zod-Schemas** (Single Source)
zwei Artefakte ab:

1. **`docs/generated/module-schema.json`** — JSON-Schema (Draft 2020-12) über
   `z.toJSONSchema(moduleContentStrictSchema)` (Zod v4 nativ). Maschinenlesbar;
   eine KI kann direkt dagegen validieren, IDEs bieten Autocomplete.
2. **`docs/generated/block-fields.md`** — auto-generierte Felder-Tabelle pro
   Block-Typ (aus dem JSON-Schema gerendert). Ersetzt das **manuelle** Tabellen-
   Pflegen in MODUL-SPEZIFIKATION; die Prosa-Erklärungen bleiben handgepflegt
   und verlinken auf die generierte Tabelle.

### Drift-Sicherung (entscheidend)

CI-Schritt `pnpm export:schema --check`: regeneriert in einen Temp-Ordner und
vergleicht mit dem eingecheckten Stand. Diff → CI rot mit „lauf `pnpm
export:schema`". So **kann** die generierte Referenz nie veralten.

### Technik

- `z.toJSONSchema()` ist in zod v4 vorhanden (verifiziert). `superRefine`-
  Regeln erscheinen NICHT im JSON-Schema (sind imperativ) — deshalb bleibt
  `validate:module` als zweite Stufe für die fachlichen Regeln nötig. Das
  generierte JSON-Schema deckt **Struktur**, validate die **Logik**.
- Neues Skript `scripts/export-schema.mjs`, npm-Script `export:schema`,
  CI-Job im bestehenden Workflow.

### Aufwand: **mittel** (1 Session). Abhängigkeit: keine.

---

## §2 Baustein B2 — Block-Self-Doc-Registry

### Problem

Pro neuem Block-Typ werden ~10 Stellen angefasst; die „menschliche" Doku
(Katalog-Beschreibung, Beispiel-JSON, KI-Hinweise) liegt verstreut in
`block-catalog.ts`, `block-stubs.ts` und `MODUL-SPEZIFIKATION.md`.

### Lösung

**Eine Registry-Datei pro Block** (oder ein Feld am Schema), die alles trägt,
was Mensch + KI über den Block wissen müssen:

```ts
// lib/blocks/registry/word-search.ts  (Beispiel-Form)
export const wordSearchDoc: BlockDoc = {
  type: 'word_search',
  label: '🔍 Wortsuchrätsel',
  group: 'worksheet',
  graded: true,
  partial: true,
  shortDescription: 'Wörter im Buchstabengitter finden …',
  aiHints: [
    'Koordinaten: across (row, col+i), down (row+i, col), diag (row+i, col+i).',
    'Geteilte Kreuzungszellen MÜSSEN denselben Buchstaben haben.',
  ],
  example: {
    /* valides Beispiel-JSON, das gegen das Schema getestet wird */
  },
  answerFormat: 'string[] (gefundene wordIds)',
  editorOnly: false, // true für hotspot/label_image
};
```

Eine zentrale `BLOCK_DOCS`-Map sammelt alle. Daraus speisen sich:

- `block-catalog.ts` (Editor-„Block hinzufügen"-Dialog)
- der B1-Schema-Export (KI-Hinweise + Beispiele in `block-fields.md`)
- der B4-Eval-Harness (jedes `example` wird automatisch validiert + im
  Renderer smoke-getestet)

### Drift-Sicherung

Ein Test `registry.test.ts` erzwingt: (1) jeder `BlockType` aus
`lib/schemas/blocks.ts` hat genau einen `BLOCK_DOCS`-Eintrag; (2) jedes
`example` besteht `moduleContentStrictSchema`. Fehlt ein Eintrag oder ist ein
Beispiel ungültig → Test rot. **Vollständigkeit per Test garantiert.**

### Migrations-Strategie

Bestehende Beschreibungen aus `block-catalog.ts` + Beispiele aus
`MODUL-SPEZIFIKATION.md` einmalig in die Registry ziehen; Katalog + Spec lesen
dann daraus. Kein Inhalt geht verloren, nur die Quelle wandert an EINEN Ort.

### Aufwand: **mittel-groß** (1–2 Sessions). Abhängigkeit: harmoniert mit B1

(Export liest die Registry).

---

## §3 Baustein B4 — KI-Selbsttest / Eval-Harness

### Problem

Wir wissen heute nicht **systematisch**, ob eine KI aus der Doku allein
gültige Module bauen kann. Wird ein Block schwer generierbar oder die Doku
unklar, merken wir es erst, wenn ein realer Batch scheitert.

### Lösung — zwei Stufen

**Stufe A — statischer Eval (sofort, kein KI-Call):** Ein Test/Skript
`pnpm eval:authoring`, der für JEDEN Block-Typ prüft:

- das Registry-`example` (B2) ist gegen das strikte Schema gültig,
- es rendert ohne Crash im Schüler-Renderer (jsdom),
- `gradeBlock` liefert für eine Musterantwort den erwarteten Score,
- `validate:module` läuft grün über ein Modul, das jeden Typ einmal enthält.

Das ist ein **Frühwarnsystem**: Bricht ein neuer Block die Erzeug-Pipeline,
schlägt der Eval an — noch bevor eine KI je danach greift. Läuft in CI, kostet
nichts, deterministisch.

**Stufe B — echter KI-Eval (optional, manuell):** Ein Skript, das eine KI
(via API) auffordert, allein aus `docs/generated/` + `MODUL-SPEZIFIKATION.md`
ein Modul für ein vorgegebenes Thema zu bauen, dann automatisch
`validate:module` drüberlaufen lässt und protokolliert: erste-Runde-Erfolg,
Anzahl Korrektur-Iterationen, häufigste Fehler. Liefert eine **Metrik für
Doku-Qualität** über die Zeit. Nicht in CI (kostet KI-Calls), sondern als
gelegentlicher Gesundheits-Check + nach jeder Doku-Änderung.

> **Sicherheits-Hinweis:** Stufe B ruft eine externe KI-API — braucht einen
> API-Key (STOP-Punkt für Geo), läuft nie automatisch/in CI, und das
> generierte JSON wird NUR validiert, nie auto-veröffentlicht (konsistent mit
> der Content-Produktions-Grenze: KI bewegt nur ⬜→🤖).

### Aufwand: Stufe A **klein** (nutzt B2-Examples), Stufe B **mittel** + braucht

KI-API-Key. Abhängigkeit: B2 (Examples) für Stufe A.

---

## §4 Nicht gewählt, aber dokumentiert (für später)

- **B3 Block-Generator-Skript** (`pnpm new:block <name>`): Gerüst aller ~10
  Dateien + Registry-Einträge vorbefüllt anlegen. Würde das Bauen NEUER
  Block-Typen fast mechanisch machen. Sinnvoll erst NACH B2 (das Gerüst muss
  den Registry-Eintrag mitschreiben). → Kandidat für eine Folge-Welle.
- **B5 Direkter KI-Editor-Knopf** in der App: „Thema → Entwurf" als ein Klick.
  Größter UX-Gewinn für Geo, aber auch größter Bau + braucht serverseitigen
  KI-Call + Kosten-Kontrolle. → Vision-Phase.

---

## §5 Empfohlene Reihenfolge

1. **B1 Auto-Schema-Export** zuerst — sofort nützlich, unabhängig, sichert die
   strukturelle Referenz gegen Drift.
2. **B2 Self-Doc-Registry** — zieht die verstreute Doku zusammen; der
   B1-Export liest danach die Registry mit (KI-Hinweise + Beispiele).
3. **B4 Stufe A** — fällt nach B2 fast „gratis" ab (validiert die Examples).
4. **B4 Stufe B** — wenn Geo einen KI-API-Key bereitstellt; als wiederkehrender
   Doku-Gesundheits-Check.

Jeder Baustein ist ein eigener, abgeschlossener Commit mit grünem Gate. Nach
jedem Baustein: `MODUL-SPEZIFIKATION.md` + dieses Dokument aktualisieren.

## §6 Was sich für die KI konkret ändert (Vorher/Nachher)

| Heute                                                  | Nach B1+B2+B4                                                                 |
| ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| KI liest Prosa-Doku, die manuell aktuell gehalten wird | KI liest auto-generiertes JSON-Schema + Examples, garantiert code-treu        |
| Neuer Block = ~10 Stellen von Hand, Doku-Drift möglich | Registry-Eintrag ist Pflicht (Test erzwingt Vollständigkeit)                  |
| „Klappt KI-Generierung?" = Bauchgefühl                 | Eval-Harness misst es bei jedem CI-Lauf (Stufe A) + periodisch echt (Stufe B) |
