<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Für KI: ein Lernmodul bauen

**Wenn du gebeten wirst, ein Lernmodul / Quiz / Arbeitsblatt-Inhalt zu erzeugen:**

1. **Lies zuerst** `docs/QUICKSTART-MODUL.md` — der durchgehende Ablauf
   (generieren → validieren → testen → freigeben).
2. **Format + Felder** stehen in `docs/MODUL-SPEZIFIKATION.md` (18 Block-Typen,
   je eine Feld-Tabelle + valides Beispiel-JSON). Das ist die verbindliche
   Wahrheit — kein Quellcode nötig, um JSON zu erzeugen.
3. **Validiere jedes erzeugte Modul** im Closed Loop, bis grün:
   ```bash
   pnpm validate:module pfad/zu/modul.json
   ```
   Die Fehlermeldung nennt Block + Feld — korrigieren und erneut laufen lassen.
4. **Stelle nichts selbst online.** Du lieferst validiertes JSON; das
   Veröffentlichen ist ein bewusster Mensch-Schritt (siehe Quickstart §4).

Single Source of Truth ist immer der Code (`lib/schemas/blocks.ts` Struktur,
`lib/blocks/evaluate.ts` Bewertung). Bei Widerspruch gewinnt der Code.
