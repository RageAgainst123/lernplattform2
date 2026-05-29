"""Design-Tokens für druckbare Arbeitsblätter (PDF).

SPIEGELUNG VON `lib/brand.ts` — bei JEDER Änderung BEIDE Stellen +
`docs/DESIGN-SYSTEM.md` aktualisieren. Siehe ADR-0010.

Tailwind-Klassen / TS-Code (Web) und reportlab (PDF) können nicht direkt
denselben Wert importieren — eine Sprache muss spiegeln. Wir entscheiden uns
für zwei kleine, gut sichtbare Quellen statt einer fragilen JSON-Indirektion.
"""

from reportlab.lib import colors
from reportlab.lib.units import mm


# --- Farben (identisch zu lib/brand.ts COLORS) ------------------------------

# Akzent / Primary — Brand-Blau.
PRIMARY = colors.HexColor("#2563eb")
PRIMARY_LIGHT = colors.HexColor("#eff6ff")
PRIMARY_BORDER = colors.HexColor("#bfdbfe")

# Neutral-Skala (Slate).
TEXT = colors.HexColor("#0f172a")
TEXT_MUTED = colors.HexColor("#64748b")
TEXT_LIGHT = colors.HexColor("#94a3b8")
BACKGROUND = colors.HexColor("#ffffff")
SURFACE = colors.HexColor("#f8fafc")
BORDER = colors.HexColor("#e2e8f0")

# Semantik.
SUCCESS = colors.HexColor("#16a34a")
WARNING = colors.HexColor("#ca8a04")
ERROR = colors.HexColor("#dc2626")


# --- Spacing (in Millimetern fürs PDF) ---------------------------------------
# Web-SPACING ist in Pixeln; PDF arbeitet in mm. Umrechnung ist nicht 1:1
# (Web-px sind virtuell), wir wählen druckwirksame mm-Werte.

SPACE_XS = 1.5 * mm
SPACE_SM = 3 * mm
SPACE_MD = 5 * mm
SPACE_LG = 8 * mm
SPACE_XL = 12 * mm
SPACE_XXL = 18 * mm


# --- Typografie (Punkt — reportlab-Standard) --------------------------------

FONT_FAMILY = "Helvetica"
FONT_FAMILY_BOLD = "Helvetica-Bold"

FONT_H1 = 22
FONT_H2 = 15
FONT_H3 = 13
FONT_BODY = 11
FONT_SMALL = 9
FONT_MICRO = 8

# Zeilenabstand (Faktor zur Schriftgröße).
LINE_HEIGHT = 1.4


# --- Radius / Layout ---------------------------------------------------------

RADIUS_SM = 2
RADIUS_MD = 4
RADIUS_LG = 6

# A4-Ränder (außen).
PAGE_MARGIN_LEFT = 20 * mm
PAGE_MARGIN_RIGHT = 20 * mm
PAGE_MARGIN_TOP = 18 * mm
PAGE_MARGIN_BOTTOM = 16 * mm

# Inhalts-Breite (A4 = 210 mm minus Ränder = 170 mm).
CONTENT_WIDTH = 170 * mm

# Höhe einer Schreiblinie (für Lückentext/Reflexion).
WRITE_LINE_HEIGHT = 9 * mm
