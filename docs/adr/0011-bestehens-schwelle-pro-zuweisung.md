# ADR 0011 — Bestehens-Schwelle pro Zuweisung (nicht pro Modul)

**Status:** akzeptiert · **Datum:** 2026-05-30

## Kontext

Module sollen eine Bestehens-Schwelle bekommen (z. B. 80 %), ab der eine Abgabe
als „bestanden" zählt und die Fortschritts-Matrix grün/rot färbt. Die Schwelle
könnte am Modul selbst (`modules`) oder an der Klassen-Zuweisung (`class_modules`)
hängen.

## Entscheidung

Die Schwelle (`class_modules.pass_threshold`, smallint 0–100, NULL = keine) lebt
**pro Zuweisung** auf `class_modules` — nicht pro Modul. Lehrer:innen setzen sie
beim Zuweisen oder inline pro Klasse (`ThresholdEditor`).

`isPassed(score, max, threshold)` in `lib/blocks/evaluate.ts` ist die einzige
Entscheidungsstelle: NULL-Schwelle ODER `maxScore = 0` → „bestanden" nicht
anwendbar (neutrale Anzeige, nie „0 %").

## Verworfen

- **Pro Modul (`modules.pass_threshold`):** einfacher, aber unflexibel — dasselbe
  Modul müsste in jeder Klasse dieselbe Schwelle haben. Differenzierung zwischen
  Klassen/Stufen wäre nicht abbildbar.

## Konsequenzen

**Positiv:**

- Dieselbe Lerneinheit kann in Klasse A mit 80 %, in Klasse B mit 60 % bestanden
  sein — passt zur Mehrstufen-/Differenzierungs-Realität.
- Bestehende Module bleiben unberührt; die Schwelle ist reine Zuweisungs-Metadaten.

**Negativ / Risiko:**

- Die Schwelle muss pro Zuweisung gepflegt werden (kein globaler Default am Modul).
  Akzeptabel, da Lehrer:innen ohnehin pro Klasse zuweisen.
