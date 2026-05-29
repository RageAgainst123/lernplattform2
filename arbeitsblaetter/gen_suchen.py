"""Erzeugt das Arbeitsblatt „Suchen im Internet" (5. SSt., Information).

Lehrplan-Bezug: BGBl. II 267/2022 — Teilkompetenzen 1.4 (T) + 1.6 (I).
Aufruf:  python arbeitsblaetter/gen_suchen.py
"""

import sys
from pathlib import Path

# Package-Kontext aufbauen damit `import _styles` funktioniert,
# auch wenn das Skript direkt aufgerufen wird.
sys.path.insert(0, str(Path(__file__).parent))

import _styles as s  # noqa: E402
from _styles import vspace  # noqa: E402

OUT = "arbeitsblaetter/suchen-im-internet-arbeitsblatt.pdf"


def build():
    doc = s.make_doc(OUT)
    story = []

    # Kopf
    story.extend(s.header("Suchen im Internet", "Digitale Grundbildung &middot; 5. Schulstufe &middot; Arbeitsblatt"))

    # Lernziele
    story.append(
        s.lernziele_box(
            [
                "den Unterschied zwischen Browser und Suchmaschine erklären.",
                "gute Suchbegriffe formulieren.",
                "Suchergebnisse bewerten (Werbung, Quelle, Aktualität).",
            ]
        )
    )
    story.append(vspace(4))

    # Theorie
    story.append(
        s.theorie_box(
            "Wenn du etwas im Internet suchst, hilft dir eine <b>Suchmaschine</b>. "
            "Du tippst <b>Stichwörter</b> ein, und die Suchmaschine zeigt dir eine "
            "Liste mit <b>Treffern</b>. Achtung: Nicht jeder Treffer ist gleich gut — "
            "manche sind <b>Anzeigen</b> (Werbung), manche stimmen nicht. Prüfe "
            "immer die <b>Quelle</b>, bevor du etwas glaubst."
        )
    )
    story.append(vspace(3))

    story.append(
        s.merksatz_box(
            "Merke",
            "Eine Suchmaschine ist kein Browser. Firefox, Chrome und Safari sind "
            "Browser — Google, Ecosia oder fragFINN sind Suchmaschinen.",
        )
    )
    story.append(vspace(6))

    # Aufgabe 1 — Multiple Choice
    story.append(s.aufgabe_header(1, "Browser oder Suchmaschine?"))
    story.extend(
        s.mc_checkboxes(
            "Welche dieser Namen sind <b>KEINE</b> Suchmaschinen? (Mehrere möglich)",
            ["Firefox", "Google", "Safari", "Ecosia"],
        )
    )
    story.append(vspace(4))

    # Aufgabe 2 — Wahr/Falsch
    story.append(s.aufgabe_header(2, "Wahr oder Falsch?"))
    story.extend(
        s.wf_choices(
            "„Der erste Treffer in einer Suche ist immer der beste."
        )
    )
    story.append(vspace(4))

    # Aufgabe 3 — Lückentext
    story.append(s.aufgabe_header(3, "Lückentext"))
    story.extend(
        s.lueckentext_lines(
            "Setze die richtigen Wörter ein. Wähle aus: "
            "<b>Stichwörter</b> &middot; <b>Quelle</b> &middot; "
            "<b>Anzeige</b> &middot; <b>Verbindung</b><br/><br/>"
            "Wenn du suchst, tippst du am besten kurze _________ ein. "
            "Bei jedem Treffer solltest du prüfen, ob er aus einer guten "
            "_________ stammt.",
            n_lines=2,
        )
    )
    story.append(vspace(4))

    # Aufgabe 4 — Match
    story.append(s.aufgabe_header(4, "Suchmaschine + Besonderheit"))
    story.extend(
        s.match_table(
            "Ordne jede Suchmaschine ihrer Besonderheit zu (Buchstabe in die Linie).",
            pairs=["fragFINN", "Blinde Kuh", "Ecosia", "Google"],
            # Eindeutige Kategorien (Legende A/B/C). pairs[i] → categories index
            # wird vom Schüler ergänzt.
            categories=["Nur Kinderseiten", "Pflanzt Bäume", "Sammelt viele Daten"],
        )
    )
    story.append(vspace(4))

    # Aufgabe 5 — Reflexion
    story.append(s.aufgabe_header(5, "Deine Meinung"))
    story.extend(
        s.reflexion_lines(
            "Stell dir vor, du hast ein Suchergebnis und bist dir nicht sicher, ob "
            "es wirklich stimmt. Was kannst du tun, um es zu überprüfen?",
            n_lines=5,
        )
    )
    story.append(vspace(6))

    # Footer
    story.append(s.footer_lehrplan(5, "Information", "K1.4 + K1.6"))

    doc.build(story)
    print(f"PDF erstellt: {OUT}")


if __name__ == "__main__":
    build()
