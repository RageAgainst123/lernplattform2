# Inhaltskonzept: Begriffe, Struktur, Sichtbarkeit

> Diese Datei klärt das **Was** der Inhalte — Begriffe, Ebenen, wer was sieht.
> Sie ist die verbindliche Referenz, bevor Inhalts-Features gebaut werden.
> Stand: 2026-05-26.

## 1. Grundprinzip: Inhalte erstellt nur der Autor (Geo)

- **Geo (Autor/Admin)** erstellt alle Inhalte (Materialien + Module).
- **Lehrer:innen erstellen nichts.** Sie **wählen aus** und **weisen zu**.
- → Es gibt **keinen Modul-Editor für Lehrer:innen**. Inhalte entstehen vom Autor
  (vorerst per Seed/SQL, später evtl. ein Autoren-Editor — eigenes Thema).

## 2. Zwei Inhalts-Arten (NICHT verwechseln)

Das war das ursprüngliche Wording-Problem: „Aufgabe / Aktivität / Modul" wurden
vermischt. Tatsächlich gibt es **zwei verschiedene Dinge**:

|                  | **Material**                                          | **Modul**                                                           |
| ---------------- | ----------------------------------------------------- | ------------------------------------------------------------------- |
| **Was**          | PDF (Theorie, Arbeitsblatt, Lösung, Stundenbild)      | Interaktive Block-Aufgabe (Quiz, Lückentext, Zuordnen, Reflexion …) |
| **Format**       | Datei zum Ansehen/Drucken                             | Block-für-Block am Bildschirm                                       |
| **Sichtbarkeit** | **Öffentlich**, ohne Login                            | Schüler:innen **nach Zuweisung** durch Lehrer:in                    |
| **Interaktion**  | herunterladen, ausdrucken                             | durchklicken, Antworten, Fortschritt wird gespeichert               |
| **Tabelle**      | `materials` (existiert, noch leer)                    | `modules` (existiert, EVA-Demo drin)                                |
| **Lösungen**     | `is_teacher_only`-Flag (nur eingeloggte Lehrer:innen) | —                                                                   |

**Sprachregelung (verbindlich):**

- **„Material"** = das öffentliche PDF-artige.
- **„Modul"** = die interaktive, zuweisbare Lerneinheit.
- „Aufgabe" / „Aktivität" verwenden wir **nicht** als Fachbegriffe (mehrdeutig).
  In Schüler:innen-Texten ist „Aufgabe" als Alltagswort ok, aber im
  Code/Datenmodell/Lehrer:innen-UI heißt es **Modul**.

## 3. Navigations-Hierarchie (verbindlich)

Die öffentliche Website ist eine **durchgehende, aufbauende Leiter** — Lehrer:innen
sollen lückenlos sehen, was in welcher Stufe drankommt. Vorbild easy4me.info, aber
übersichtlicher (klare Leiter statt loser Themen-Haufen).

```
FACH
├─ Digitale Grundbildung           ← JETZT Fokus
│   ├─ Primarstufe (1.–4. Schulstufe)        [später]
│   └─ Sekundarstufe (5.–8. Schulstufe)      [JETZT]
│        ├─ 5. Schulstufe
│        │    └─ KOMPETENZBEREICH (orientierung | information |
│        │         kommunikation | produktion | handeln)
│        │         └─ THEMA (z.B. "Suchmaschinen")
│        │              ├─ MATERIAL(ien)  → öffentliche PDFs
│        │              └─ MODUL(e)        → interaktiv, zuweisbar
│        ├─ 6. / 7. / 8. Schulstufe (gleiche Gliederung)
│
└─ Informatik                       [SPÄTER, Vertiefung]
```

**Ebenen, von oben nach unten:**

1. **Fach** — vorerst nur _Digitale Grundbildung_. _Informatik_ später als Vertiefung.
2. **Schulstufe** — Hauptnavigation. Aufbauend 5 → 6 → 7 → 8 (Primarstufe später).
3. **Kompetenzbereich** — die 5 fixen Lehrplan-Bereiche, Gliederung innerhalb der Stufe.
4. **Thema** — Freitext (z.B. "Suchmaschinen", "EVA-Prinzip").
5. **Material / Modul** — die eigentlichen Inhalte.

**Anspruch:** Alle DGB-Themen, **aufbauend, lückenlos**. Eine Lehrer:in der 5. Klasse klickt „5. Schulstufe" und sieht alle Bereiche/Themen ihrer Stufe in
der richtigen Reihenfolge — nichts wird vergessen.

**Datenmodell-Konsequenz:** `kompetenzbereich` (enum) + `schulstufe` (smallint) +
`topic` (text) sind **bereits** auf `materials` und `modules`. Es fehlt nur eine
**Fach-Ebene** (Digitale Grundbildung / Informatik) — solange nur DGB gebaut wird,
kann sie als fester Wert/späteres Feld behandelt werden. Vor dem Informatik-Ausbau:
Feld `fach` (enum: dgb | informatik) auf beide Tabellen ergänzen (eigene Migration).

## 4. Wer sieht/macht was — Nutzer-Rollen

| Rolle                       | Material                                        | Modul                                                           |
| --------------------------- | ----------------------------------------------- | --------------------------------------------------------------- |
| **Öffentlich (ohne Login)** | sehen + herunterladen (außer `is_teacher_only`) | — (sieht nur, dass es Module gibt; bearbeiten nur eingeloggt)   |
| **Lehrer:in (eingeloggt)**  | sehen + auch Lösungen                           | Module der Klasse **zuweisen**, Fortschritt der Klasse sehen    |
| **Schüler:in (Code+PIN)**   | — (kommt über öffentlichen Bereich dran)        | **zugewiesene** Module bearbeiten, Fortschritt wird gespeichert |
| **Autor (Geo)**             | erstellt Materialien                            | erstellt Module                                                 |

## 5. Offene Design-Frage: „Lernpfad"?

Geo überlegt, ob Module zu einem Thema einen geordneten **Lernpfad** bilden
sollen (Modul 1 → Modul 2 → …, ggf. nacheinander freigeschaltet).

**Optionen:**

- **A — Flache Liste (aktuell):** Pro Thema mehrere unabhängige Module, frei
  wählbar. Einfachstes Modell, kein Umbau nötig.
- **B — Geordneter Pfad:** Module eines Themas haben eine Reihenfolge
  (`sort_order`), werden als Schritt-für-Schritt-Pfad angezeigt. Kleiner Zusatz
  (ein Sortier-Feld + Anzeige), kein neues Konzept.
- **C — Echter Lernpfad mit Freischaltung:** Modul 2 erst nach Abschluss von
  Modul 1. Pädagogisch reizvoll, aber mehr Logik (Voraussetzungen, Sperren).

**Empfehlung:** Mit **A** starten (ist gebaut), **B** als kleine Erweiterung
einplanen, sobald es mehrere Module pro Thema gibt. **C** erst, wenn echter
Bedarf entsteht — nicht vorab verkomplizieren. Entscheidung vertagt, bis das
erste Thema steht.

## 6. Was als Nächstes gebaut wird (Reihenfolge, mit Geo abgestimmt)

1. **Öffentliche Website mit erstem echtem Thema** (5. Schulstufe Informatik,
   erstes Lehrplan-Thema). Klar + logisch aufgebaut, sodass eine Lehrer:in sofort
   versteht, wie sie strukturell vorgeht. Beginnt mit Material(ien) zum Thema.
2. **Modul zu diesem Thema** erstellen und einer Test-Klasse **zuweisen** (durch
   Lehrer:in, nicht per SQL) → Kinder absolvieren es.
3. Danach Bewertung, ob ein **Lernpfad** (Abschnitt 5) sinnvoll ist.

## 7. Bewusst (noch) NICHT

- Kein Lehrer:innen-Modul-Editor (Inhalte macht der Autor).
- Keine Lernpfad-Freischaltung (Option C) ohne nachgewiesenen Bedarf.
- Keine Vermischung von „Material" und „Modul" in einer Tabelle/UI.
