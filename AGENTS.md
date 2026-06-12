<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Für KI: ein Lernmodul bauen

**Wenn du gebeten wirst, ein Lernmodul / Quiz / Arbeitsblatt-Inhalt zu erzeugen:**

0. **Bei mehreren Themen / einem Batch:** zuerst `docs/CONTENT-PRODUKTION.md`
   lesen (Soll-Katalog, Status-Matrix, Batch-Regeln). **Nur Themen mit Status ⬜
   produzieren** — 💡 sind unbestätigte Vorschläge; die Matrix bewegst du
   ausschließlich ⬜→🤖.
1. **Lies zuerst** `docs/QUICKSTART-MODUL.md` — der durchgehende Ablauf
   (generieren → validieren → testen → freigeben).
2. **Format + Felder** stehen in `docs/MODUL-SPEZIFIKATION.md` (23 Block-Typen,
   je eine Feld-Tabelle + valides Beispiel-JSON). Das ist die verbindliche
   Wahrheit — kein Quellcode nötig, um JSON zu erzeugen. Auch die Spiel-Typen
   `memory`, `crossword`, `word_search`, `scramble` und `hangman` sind per JSON baubar;
   nur `hotspot`/`label_image` brauchen den Editor (Bild-Koordinaten).
3. **Validiere jedes erzeugte Modul** im Closed Loop, bis grün:
   ```bash
   pnpm validate:module pfad/zu/modul.json
   ```
   Die Fehlermeldung nennt Block + Feld — korrigieren und erneut laufen lassen.
   Bei `crossword` prüft das Script auch Gitter-Fit + Kreuzungs-Konflikte.
4. **Stelle nichts selbst online.** Du lieferst validiertes JSON; der Mensch
   importiert es im Editor, spielt es im Tab **„🎒 Als Schüler:in testen"**
   durch und veröffentlicht bewusst (siehe Quickstart §4).

Single Source of Truth ist immer der Code (`lib/schemas/blocks.ts` Struktur,
`lib/blocks/evaluate.ts` Bewertung). Bei Widerspruch gewinnt der Code.
