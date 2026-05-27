"""Erzeugt das kindgerechte EVA-Arbeitsblatt (5. Schulstufe) als PDF."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

OUT = "arbeitsblaetter/eva-prinzip-arbeitsblatt.pdf"

styles = getSampleStyleSheet()
h1 = ParagraphStyle("h1", parent=styles["Title"], fontSize=22, spaceAfter=2)
sub = ParagraphStyle("sub", parent=styles["Normal"], fontSize=11,
                     textColor=colors.HexColor("#555555"), spaceAfter=14)
intro = ParagraphStyle("intro", parent=styles["Normal"], fontSize=12, leading=18)
aufg = ParagraphStyle("aufg", parent=styles["Heading2"], fontSize=14,
                      spaceBefore=12, spaceAfter=5,
                      textColor=colors.HexColor("#1a1a1a"))
body = ParagraphStyle("body", parent=styles["Normal"], fontSize=12, leading=18)
small = ParagraphStyle("small", parent=styles["Normal"], fontSize=10,
                       textColor=colors.HexColor("#777777"))


def box(text, style):
    """Ein Absatz in einer hellen Box (für die Merk-Erklärung)."""
    t = Table([[Paragraph(text, style)]], colWidths=[170 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#eef4ff")),
        ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#9bbcf0")),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    return t


def write_lines(n):
    """n leere Schreiblinien als dünne Tabellen-Zeilen."""
    rows = [[""] for _ in range(n)]
    t = Table(rows, colWidths=[170 * mm], rowHeights=[9 * mm] * n)
    t.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, colors.HexColor("#cccccc")),
    ]))
    return t


def build():
    doc = SimpleDocTemplate(OUT, pagesize=A4,
                            leftMargin=20 * mm, rightMargin=20 * mm,
                            topMargin=18 * mm, bottomMargin=16 * mm)
    s = []
    s.append(Paragraph("Das EVA-Prinzip", h1))
    s.append(Paragraph("Digitale Grundbildung &middot; 5. Schulstufe &middot; Arbeitsblatt", sub))

    s.append(box(
        "<b>Merke:</b> Ein Computer arbeitet immer in drei Schritten: "
        "<b>E</b>ingabe &rarr; <b>V</b>erarbeitung &rarr; <b>A</b>usgabe. "
        "Das nennt man das <b>EVA-Prinzip</b>. "
        "Mit Eingabegeräten gibst du etwas in den Computer ein. "
        "Der Computer verarbeitet es. Mit Ausgabegeräten zeigt er dir das Ergebnis.",
        intro))
    s.append(Spacer(1, 6))

    # Aufgabe 1 — Zuordnen
    s.append(Paragraph("Aufgabe 1 &mdash; Ordne richtig zu", aufg))
    s.append(Paragraph(
        "Schreibe hinter jedes Gerät, ob es ein <b>Eingabegerät</b> oder ein "
        "<b>Ausgabegerät</b> ist.", body))
    s.append(Spacer(1, 6))
    geraete = ["Tastatur", "Drucker", "Maus", "Bildschirm", "Mikrofon", "Lautsprecher"]
    rows = [["Gerät", "Eingabe oder Ausgabe?"]]
    for g in geraete:
        rows.append([g, ""])
    t1 = Table(rows, colWidths=[60 * mm, 110 * mm], rowHeights=[9 * mm] * len(rows))
    t1.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#bbbbbb")),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f0f0f0")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("FONTSIZE", (0, 0), (-1, -1), 12),
    ]))
    s.append(t1)

    # Aufgabe 2 — Lückentext
    s.append(Paragraph("Aufgabe 2 &mdash; Fülle die Lücken", aufg))
    s.append(Paragraph(
        "Setze die richtigen Wörter ein: "
        "<i>Eingabe &middot; Verarbeitung &middot; Ausgabe</i>", body))
    s.append(Spacer(1, 8))
    s.append(Paragraph(
        "Beim EVA-Prinzip kommt zuerst die ______________________, "
        "dann die ______________________ und zuletzt die ______________________.",
        body))

    # Aufgabe 3 — Eigenes Beispiel
    s.append(Paragraph("Aufgabe 3 &mdash; Dein eigenes Beispiel", aufg))
    s.append(Paragraph(
        "Suche dir ein Gerät aus deinem Alltag aus (zum Beispiel ein Tablet, "
        "eine Spielkonsole oder einen Taschenrechner). Beschreibe: "
        "Was ist dort die Eingabe? Was ist die Ausgabe?", body))
    s.append(Spacer(1, 4))
    s.append(write_lines(3))

    s.append(Spacer(1, 10))
    s.append(Paragraph("Name: ______________________________     Klasse: ____________", small))

    doc.build(s)
    print("PDF erstellt:", OUT)


if __name__ == "__main__":
    build()
