"""Layout-Bausteine für druckbare Arbeitsblätter (PDF).

Generator-Skripte (`arbeitsblaetter/gen_*.py`) komponieren PDFs AUSSCHLIESSLICH
aus diesen Helpern — KEINE eigenen Farben/Spacings. Damit bleibt das
Corporate Design über alle Arbeitsblätter konsistent. Bei Änderungen an
Farben/Spacings die `_design_tokens.py`-Datei updaten (UND `lib/brand.ts`
spiegelnd; siehe ADR-0010).
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    Image,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

# Tokens import — funktioniert sowohl als Package (Modul-Aufruf) als auch
# als direktes Skript (Generator-Skripte machen sys.path.insert).
try:
    from . import _design_tokens as t
except ImportError:
    import _design_tokens as t  # type: ignore[no-redef]

# ---------------------------------------------------------------------------
# Paragraph-Styles (zentral definiert, damit Generator-Skripte sie nur noch
# über Konstanten referenzieren).
# ---------------------------------------------------------------------------

STYLE_H1 = ParagraphStyle(
    "h1",
    fontName=t.FONT_FAMILY_BOLD,
    fontSize=t.FONT_H1,
    textColor=t.TEXT,
    leading=t.FONT_H1 * t.LINE_HEIGHT,
    spaceAfter=2,
)
STYLE_SUBTITLE = ParagraphStyle(
    "subtitle",
    fontName=t.FONT_FAMILY,
    fontSize=t.FONT_SMALL,
    textColor=t.TEXT_MUTED,
    leading=t.FONT_SMALL * t.LINE_HEIGHT,
    spaceAfter=14,
)
STYLE_H2 = ParagraphStyle(
    "h2",
    fontName=t.FONT_FAMILY_BOLD,
    fontSize=t.FONT_H2,
    textColor=t.TEXT,
    leading=t.FONT_H2 * t.LINE_HEIGHT,
    spaceBefore=10,
    spaceAfter=5,
)
STYLE_BODY = ParagraphStyle(
    "body",
    fontName=t.FONT_FAMILY,
    fontSize=t.FONT_BODY,
    textColor=t.TEXT,
    leading=t.FONT_BODY * t.LINE_HEIGHT,
)
STYLE_BODY_BOLD = ParagraphStyle(
    "body_bold",
    parent=STYLE_BODY,
    fontName=t.FONT_FAMILY_BOLD,
)
STYLE_SMALL = ParagraphStyle(
    "small",
    fontName=t.FONT_FAMILY,
    fontSize=t.FONT_SMALL,
    textColor=t.TEXT_MUTED,
    leading=t.FONT_SMALL * t.LINE_HEIGHT,
)
STYLE_MICRO = ParagraphStyle(
    "micro",
    fontName=t.FONT_FAMILY,
    fontSize=t.FONT_MICRO,
    textColor=t.TEXT_LIGHT,
    leading=t.FONT_MICRO * t.LINE_HEIGHT,
)


# ---------------------------------------------------------------------------
# Hilfsfunktionen
# ---------------------------------------------------------------------------


def _box_table(content_flowables, background, border):
    """Eine Tabelle mit einer Zelle als Hintergrund-Box. Generischer Helper."""
    tbl = Table([[content_flowables]], colWidths=[t.CONTENT_WIDTH])
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), background),
                ("BOX", (0, 0), (-1, -1), 0.6, border),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    return tbl


# ---------------------------------------------------------------------------
# High-Level-Bausteine (das Vokabular des Autors)
# ---------------------------------------------------------------------------


def header(title, subtitle):
    """Titel + Untertitel-Zeile. Standard für jedes Arbeitsblatt.

    `subtitle` ist typischerweise „Digitale Grundbildung · 5. Schulstufe ·
    Arbeitsblatt" — Brand-Konsistenz.
    """
    return [
        Paragraph(title, STYLE_H1),
        Paragraph(subtitle, STYLE_SUBTITLE),
    ]


def lernziele_box(items):
    """Lernziele-Box im Akzent-Farbschema. `items` ist eine Liste von Strings."""
    lines = ["<b>Nach diesem Arbeitsblatt kannst du …</b>"]
    for item in items:
        lines.append(f"&bull; {item}")
    para = Paragraph("<br/>".join(lines), STYLE_BODY)
    return _box_table([para], t.PRIMARY_LIGHT, t.PRIMARY_BORDER)


def theorie_box(text):
    """Theorie-Erklärung in einer dezent gefärbten Box."""
    para = Paragraph(text, STYLE_BODY)
    return _box_table([para], t.SURFACE, t.BORDER)


def merksatz_box(title, text):
    """„Merke"-Box: entspricht der Web-Infobox. Akzent-tönt."""
    flow = [
        Paragraph(f"<b>{title}</b>", STYLE_BODY_BOLD),
        Spacer(1, 3),
        Paragraph(text, STYLE_BODY),
    ]
    return _box_table(flow, t.PRIMARY_LIGHT, t.PRIMARY_BORDER)


def aufgabe_header(nr, titel):
    """„Aufgabe N · Titel" als H2."""
    return Paragraph(f"Aufgabe {nr} &middot; {titel}", STYLE_H2)


def mc_checkboxes(question, options):
    """Multiple-Choice mit ankreuzbaren Kästchen.

    `options`: Liste von Strings (Antworttexte).
    """
    flow = [Paragraph(question, STYLE_BODY)]
    rows = []
    for opt in options:
        rows.append(["☐", Paragraph(opt, STYLE_BODY)])
    tbl = Table(rows, colWidths=[10, t.CONTENT_WIDTH - 10])
    tbl.setStyle(
        TableStyle(
            [
                ("FONTSIZE", (0, 0), (0, -1), 14),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    flow.append(Spacer(1, 4))
    flow.append(tbl)
    return flow


def wf_choices(question):
    """„Wahr ☐  Falsch ☐"-Zeile."""
    flow = [Paragraph(question, STYLE_BODY)]
    flow.append(Spacer(1, 6))
    tbl = Table([["☐", "Wahr", "", "☐", "Falsch"]], colWidths=[12, 30, 20, 12, 30])
    tbl.setStyle(
        TableStyle(
            [
                ("FONTSIZE", (0, 0), (-1, -1), 12),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    flow.append(tbl)
    return flow


def lueckentext_lines(intro, n_lines=1):
    """Aufgabe mit Lückentext-Intro + n Schreiblinien.

    Im Druck kennt Papier keine echten Lücken — wir machen eine Anleitung
    + Schreiblinien drunter, in die der Schüler die Lösungswörter schreibt.
    """
    flow = [Paragraph(intro, STYLE_BODY)]
    flow.append(Spacer(1, 4))
    flow.append(write_lines(n_lines))
    return flow


def write_lines(n):
    """n leere Schreiblinien als dünne Tabellen-Zeilen."""
    rows = [[""] for _ in range(n)]
    tbl = Table(rows, colWidths=[t.CONTENT_WIDTH], rowHeights=[t.WRITE_LINE_HEIGHT] * n)
    tbl.setStyle(
        TableStyle(
            [
                ("LINEBELOW", (0, 0), (-1, -1), 0.4, t.BORDER),
            ]
        )
    )
    return tbl


def match_table(question, pairs, categories):
    """Zuordnungsaufgabe als zweispaltige Tabelle.

    `pairs`: Liste der Begriffe (links).
    `categories`: Liste der möglichen Kategorien (rechts, zur Auswahl).
    Schüler:innen tragen den Buchstaben/Index der Kategorie hinter den Begriff.
    """
    flow = [Paragraph(question, STYLE_BODY)]
    flow.append(Spacer(1, 4))
    # Kategorie-Legende.
    legend_items = []
    for i, cat in enumerate(categories):
        letter = chr(ord("A") + i)
        legend_items.append(f"<b>{letter}</b> = {cat}")
    flow.append(Paragraph(" &middot; ".join(legend_items), STYLE_SMALL))
    flow.append(Spacer(1, 6))
    rows = []
    for term in pairs:
        rows.append([term, "→", "____"])
    tbl = Table(rows, colWidths=[100, 20, 50])
    tbl.setStyle(
        TableStyle(
            [
                ("FONTSIZE", (0, 0), (-1, -1), t.FONT_BODY),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    flow.append(tbl)
    return flow


def reflexion_lines(prompt, n_lines=4):
    """Offene Reflexion: Prompt + n Schreiblinien."""
    flow = [Paragraph(prompt, STYLE_BODY)]
    flow.append(Spacer(1, 6))
    flow.append(write_lines(n_lines))
    return flow


def footer_lehrplan(stufe, bereich, kompetenzen):
    """Footer-Zeile mit Lehrplan-Marker (klein + grau, eine Zeile).

    Beispiel: „DGB · 5. Schulstufe · Bereich Information · K1.4 + K1.6"
    """
    text = f"Digitale Grundbildung &middot; {stufe}. Schulstufe &middot; Bereich {bereich} &middot; {kompetenzen}"
    return Paragraph(text, STYLE_MICRO)


# ---------------------------------------------------------------------------
# Document-Setup
# ---------------------------------------------------------------------------


def make_doc(out_path):
    """Standard-A4-Document mit Brand-Margen."""
    return SimpleDocTemplate(
        out_path,
        pagesize=A4,
        leftMargin=t.PAGE_MARGIN_LEFT,
        rightMargin=t.PAGE_MARGIN_RIGHT,
        topMargin=t.PAGE_MARGIN_TOP,
        bottomMargin=t.PAGE_MARGIN_BOTTOM,
        title="Arbeitsblatt",
        author="DGB Austria",
    )


def vspace(mm_value):
    """Vertikaler Abstand in mm — Generator-Skripte nutzen das statt
    direkter `Spacer`-Aufrufe.
    """
    from reportlab.lib.units import mm

    return Spacer(1, mm_value * mm)
