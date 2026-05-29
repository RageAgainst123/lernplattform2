"""Erzeugt das kindgerechte EVA-Arbeitsblatt (5. Schulstufe) als PDF.

Lehrplan-Bezug: BGBl. II 267/2022 — Bereich Orientierung (1.1–1.3).
Aufruf:  python arbeitsblaetter/gen_eva.py
"""

import sys
from pathlib import Path

# Package-Kontext aufbauen damit `import _styles` funktioniert,
# auch wenn das Skript direkt aufgerufen wird.
sys.path.insert(0, str(Path(__file__).parent))

from reportlab.platypus import Paragraph, Spacer, Table, TableStyle  # noqa: E402
from reportlab.lib import colors  # noqa: E402
from reportlab.lib.units import mm  # noqa: E402

import _styles as s  # noqa: E402
import _design_tokens as t  # noqa: E402
from _styles import vspace, STYLE_BODY, STYLE_SMALL  # noqa: E402

OUT = "arbeitsblaetter/eva-prinzip-arbeitsblatt.pdf"


def build():
    doc = s.make_doc(OUT)
    story = []

    # Kopf
    story.extend(s.header("Das EVA-Prinzip", "Digitale Grundbildung &middot; 5. Schulstufe &middot; Arbeitsblatt"))

    # Merksatz-Box (Theorie)
    story.append(
        s.merksatz_box(
            "Merke",
            "Ein Computer arbeitet immer in drei Schritten: "
            "<b>E</b>ingabe &rarr; <b>V</b>erarbeitung &rarr; <b>A</b>usgabe. "
            "Das nennt man das <b>EVA-Prinzip</b>. "
            "Mit Eingabegeräten gibst du etwas in den Computer ein. "
            "Der Computer verarbeitet es. Mit Ausgabegeräten zeigt er dir das Ergebnis.",
        )
    )
    story.append(vspace(3))

    # Aufgabe 1 — Zuordnen (Tabelle mit Geräten)
    story.append(s.aufgabe_header(1, "Ordne richtig zu"))
    story.append(
        Paragraph(
            "Schreibe hinter jedes Gerät, ob es ein <b>Eingabegerät</b> oder ein "
            "<b>Ausgabegerät</b> ist.",
            STYLE_BODY,
        )
    )
    story.append(Spacer(1, 6))
    geraete = ["Tastatur", "Drucker", "Maus", "Bildschirm", "Mikrofon", "Lautsprecher"]
    rows = [["Gerät", "Eingabe oder Ausgabe?"]]
    for g in geraete:
        rows.append([g, ""])
    tbl = Table(rows, colWidths=[60 * mm, 110 * mm], rowHeights=[9 * mm] * len(rows))
    tbl.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.5, t.BORDER),
                ("BACKGROUND", (0, 0), (-1, 0), t.SURFACE),
                ("FONTNAME", (0, 0), (-1, 0), t.FONT_FAMILY_BOLD),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("FONTSIZE", (0, 0), (-1, -1), t.FONT_BODY),
            ]
        )
    )
    story.append(tbl)

    # Aufgabe 2 — Lückentext
    story.append(s.aufgabe_header(2, "Fülle die Lücken"))
    story.append(
        Paragraph(
            "Setze die richtigen Wörter ein: "
            "<i>Eingabe &middot; Verarbeitung &middot; Ausgabe</i>",
            STYLE_BODY,
        )
    )
    story.append(Spacer(1, 8))
    story.append(
        Paragraph(
            "Beim EVA-Prinzip kommt zuerst die ______________________, "
            "dann die ______________________ und zuletzt die ______________________.",
            STYLE_BODY,
        )
    )

    # Aufgabe 3 — Eigenes Beispiel
    story.append(s.aufgabe_header(3, "Dein eigenes Beispiel"))
    story.append(
        Paragraph(
            "Suche dir ein Gerät aus deinem Alltag aus (zum Beispiel ein Tablet, "
            "eine Spielkonsole oder einen Taschenrechner). Beschreibe: "
            "Was ist dort die Eingabe? Was ist die Ausgabe?",
            STYLE_BODY,
        )
    )
    story.append(Spacer(1, 4))
    story.append(s.write_lines(3))

    story.append(vspace(4))
    story.append(
        Paragraph(
            "Name: ______________________________     Klasse: ____________",
            STYLE_SMALL,
        )
    )
    story.append(vspace(3))
    story.append(s.footer_lehrplan(5, "Orientierung", "K1.1 – K1.3"))

    doc.build(story)
    print(f"PDF erstellt: {OUT}")


if __name__ == "__main__":
    build()
