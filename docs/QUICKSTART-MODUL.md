# Quickstart: Lernmodul von der KI bauen lassen → testen → freigeben

> **Für wen?** Geo (Freigabe) **und** jede KI/IDE, die ein Lernmodul erzeugen
> soll. Diese Datei ist der **eine durchgehende Ablauf** vom leeren Blatt bis
> „online für die Klasse". Ziel: Die KI macht 90 %, du machst nur den
> **Test- und Freigabe-Schritt**.
>
> Tiefere Referenzen: Feld-für-Feld-Spec → [`MODUL-SPEZIFIKATION.md`](MODUL-SPEZIFIKATION.md),
> didaktischer Aufbau → [`THEMA-WORKFLOW.md`](THEMA-WORKFLOW.md), KI-Prompts →
> [`AUTOR-WORKFLOW.md`](AUTOR-WORKFLOW.md). **Was** überhaupt produziert werden
> soll (Soll-Katalog, Status-Matrix, Batch-Regeln) →
> [`CONTENT-PRODUKTION.md`](CONTENT-PRODUKTION.md).

---

## Das große Bild (3 Rollen, 4 Schritte)

```
[1] KI generiert     →  Modul-JSON  ────────────┐
[2] KI/Du validiert  →  pnpm validate:module     │  kein Mensch online,
[3] Du testest       →  Editor-Tab „🎒 Als Schüler:in testen" (lokal, unveröffentlicht)
[4] Du gibst frei    →  „Veröffentlicht" anhaken + Klasse zuweisen  ←─ einziger Freigabe-Klick
```

**Wichtig:** Bis Schritt 3 ist **nichts** für Schüler:innen sichtbar. Ein Modul
wird erst sichtbar, wenn du in Schritt 4 _aktiv_ „Veröffentlicht" anhakst **und**
es einer Klasse zuweist. Du kannst beliebig viele Module als **Entwurf** anlegen
und testen, ohne dass jemand sie sieht.

---

## Schritt 1 — KI generiert das Modul-JSON

Gib der KI **diesen kompakten Auftrag** (sie braucht sonst nichts außer dem
JSON-Schema, das unten verlinkt ist). Variablen in `{…}` ausfüllen:

```text
Erzeuge ein Lernmodul als JSON für die österreichische Digitale Grundbildung.

Thema: {THEMA, z.B. "Suchmaschinen verstehen"}
Schulstufe: {5|6|7|8}
Kompetenzbereich: {orientierung|information|kommunikation|produktion|handeln}
Sprache: Du-Form, kurze Sätze (max 20 Wörter), 5.-Schulstufe-tauglich.

Aufbau (Reihenfolge verbindlich): 1 text (Hook) → 1 infobox (Merke) →
3–5 Aufgaben → 1 reflection.

Erlaubte Aufgaben-Typen (mit Teilpunkten, wo sinnvoll): multiple_choice,
true_false, fill_blank, match, categorize, mark_words, order, memory,
crossword.
(hotspot/label_image NICHT per JSON — die baue ich später im Editor mit Bild.)
(crossword: Koordinaten sorgfältig — across belegt (row, col+i), down
(row+i, col); geteilte Kreuzungszellen MÜSSEN denselben Buchstaben haben,
validate:module prüft das. Im Zweifel Wörter ohne Kreuzung legen.)

Format: { "blocks": [ … ] }. Jede id eindeutig. Halte dich exakt an die
Feld-Definitionen + Beispiele in docs/MODUL-SPEZIFIKATION.md §3.
Bei mind. einem Aufgaben-Block ein "hint" und "feedbackWrong" setzen,
das eine typische Falschvorstellung anspricht. ALLE bewertbaren Blöcke
(auch memory/crossword) unterstützen optional "hint" (HintBox nach dem
1. Fehlversuch) und "maxAttempts" (1–5 Versuche, −25 % je Wiederholung).

Gib NUR das JSON zurück.
```

> Die KI hat in `docs/MODUL-SPEZIFIKATION.md` §3 für **jeden** Typ eine
> Feld-Tabelle + ein valides Beispiel-JSON. Das reicht, um korrektes JSON zu
> erzeugen — kein Quellcode nötig.

**Bild-Aufgaben (`hotspot`, `label_image`)** kann eine KS ohne Bild nicht sinnvoll
positionieren (sie müsste Pixel-Koordinaten raten). Die baust du in **Schritt 3b**
direkt im Editor (Bild laden, Zonen aufziehen) — das dauert ~2 Minuten.

---

## Schritt 2 — Validieren (der Sicherheitsnetz-Schritt)

**Variante A — im Terminal (für KI/IDE, vollautomatisch):**

```bash
# JSON in eine Datei speichern, z.B. modul-suchmaschinen.json, dann:
pnpm validate:module modul-suchmaschinen.json
```

- **Grün** (`✅ Modul-JSON ist gültig.`) → weiter zu Schritt 3.
- **Rot** → die Meldung nennt **genau** den Block + das Feld. Die KI korrigiert
  und ruft `validate:module` erneut auf. **Diese Schleife läuft ohne Menschen**,
  bis es grün ist. (Geprüft wird gegen das echte Schema **plus** fachliche
  Regeln: eindeutige IDs, ≥1 richtige MC-Option, Lückenzahl = Platzhalter,
  ≥2 Match-Kategorien, eindeutige label_image-Begriffe usw.)

**Variante B — ohne Terminal:** Der Editor (Schritt 3) validiert beim Import
ohnehin clientseitig gegen dasselbe Schema. Wenn du also direkt importierst und
keinen Fehler siehst, ist es gültig.

---

## Schritt 3 — Testen (vor jeder Freigabe)

### 3a. JSON importieren

1. Als Admin einloggen → **`/admin/lernmodule/neu`**.
2. Metadaten links ausfüllen: Titel, Schulstufe, Kompetenzbereich, Thema,
   geschätzte Minuten. **Anzeige-Modus** = `Arbeitsblatt` (Standard) oder `Quiz`.
3. **„Veröffentlicht" NICHT anhaken** — es bleibt Entwurf.
4. Oben **„JSON importieren"** → das KI-JSON einfügen → **„Ersetzen"**.
   - Schema-Fehler erscheinen **rot direkt im Dialog** (z. B. „options:
     mindestens 2 erforderlich"). Dann das JSON von der KI nachbessern lassen.
5. **„Speichern"**.

### 3b. (Optional) Bild-Aufgaben ergänzen

Im Block-Editor **„+ Block hinzufügen"** → `Bild-Hotspots` oder
`Bild-Beschriften` → Bild laden (Upload oder Pexels) → Zonen aufs Bild ziehen →
pro Zone den Begriff/„richtig"-Status setzen. Fertig.

### 3c. Im Tab „🎒 Als Schüler:in testen" durchspielen

Der dritte Editor-Tab spielt das Modul **exakt in der Schüler-Sicht** durch —
gleicher Renderer, gleiche Bewertung, aber ohne Login, ohne zweiten Browser,
ohne DB-Schreibung:

- **Quiz-Modus:** Block für Block mit „Prüfen" → grün/rot + Teilpunkte +
  HintBox; bei `maxAttempts > 1` erscheint „Nochmal versuchen".
- **Arbeitsblatt-Modus:** alle Aufgaben auf einer Seite + „Abgeben (Test)".
- Am Ende eine **simulierte %-Auswertung** + „Neu starten". Nichts wird
  gespeichert — beliebig oft wiederholen.

(Der Tab **„Vorschau"** daneben zeigt zusätzlich jeden Block einzeln mit
„Prüfen"-Knopf — praktisch zum schnellen Checken einzelner Lösungen.)

### 3d. (Optional) Echte Schüler-Sicht mit Login

Durch den Test-Tab nur noch selten nötig. Wenn du es trotzdem 1:1 mit echtem
Login erleben willst: dem Modul testweise eine Test-Klasse zuweisen und als
Test-Schüler:in (`/k` → `TEST00` → `5T-01` → PIN `0000`) durchspielen. Danach
Zuweisung wieder entfernen, falls es noch nicht freigegeben sein soll.

---

## Schritt 4 — Freigeben (dein einziger „Online"-Klick)

Erst wenn die Vorschau passt:

1. Im Lernmodul-Editor **„Veröffentlicht"** anhaken → **Speichern**.
   - Jetzt ist es im öffentlichen Bereich sichtbar und **zuweisbar**.
2. Klasse öffnen (`/lehrer/klassen/<id>`) → Modul-Sektion → Modul wählen →
   **Zuweisen**.
   - Ab jetzt erscheint es im Schüler:innen-Dashboard `/s`.

**Zurücknehmen jederzeit möglich:** „Veröffentlicht"-Haken entfernen → Modul
verschwindet wieder aus dem öffentlichen/zuweisbaren Bereich.

---

## Wer macht was — die Arbeitsteilung in einem Satz

| Rolle  | Macht                                                                                   |
| ------ | --------------------------------------------------------------------------------------- |
| **KI** | JSON erzeugen + `validate:module` bis grün (vollautomatisch).                           |
| **Du** | Im Test-Tab durchspielen, ggf. Bild-Aufgaben ergänzen, **„Veröffentlicht"** + zuweisen. |

---

## Was die KI NICHT tun kann (bewusste Grenzen)

- **Nicht selbst online stellen.** Das „Veröffentlicht"-Anhaken + Zuweisen ist
  dein Freigabe-Schritt — Absicht, kein Bug. So geht nie etwas Ungeprüftes live.
- **Keine Bild-Koordinaten raten.** `hotspot`/`label_image` baust du im Editor
  mit echtem Bild (Schritt 3b).
- **Keine direkte DB-Schreibung.** Die KI erzeugt nur JSON/Dateien; das Einspielen
  passiert über den Editor (du) oder — für Massen-Seeds — über ein
  Seed-SQL, das du im Supabase-Dashboard ausführst (separater STOP-Punkt,
  siehe AUTOR-WORKFLOW §3).

---

## Spickzettel

```bash
pnpm validate:module pfad/zu/modul.json   # Gültigkeit prüfen (Schema + Logik)
pnpm dev                                   # lokaler Server (Port 3000) zum Testen
```

| Ich will …                    | Datei / Ort                                                |
| ----------------------------- | ---------------------------------------------------------- |
| Was soll produziert werden?   | `docs/CONTENT-PRODUKTION.md` §3 (Status-Matrix)            |
| Welche Block-Typen + Felder   | `docs/MODUL-SPEZIFIKATION.md` §2/§3                        |
| KI-Prompt-Vorlagen            | `docs/AUTOR-WORKFLOW.md` §4 (Worksheet), §7 (Live)         |
| Didaktischer Stundenaufbau    | `docs/THEMA-WORKFLOW.md` §2                                |
| Neues Modul anlegen (Editor)  | `/admin/lernmodule/neu`                                    |
| Live-Präsentation statt Modul | `/admin/praesentationen/neu` (`display_mode=presentation`) |
