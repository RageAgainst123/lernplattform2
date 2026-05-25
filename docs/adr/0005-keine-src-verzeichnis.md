# ADR-0005: Keine src/-Verzeichnisebene

**Status:** accepted
**Datum:** 2026-05-25

## Kontext

create-next-app fragt, ob ein `src/`-Verzeichnis verwendet werden soll. Die
Projekt-Dokumentation (Manifest §2, CLAUDE.md) beschreibt die Struktur mit
`app/`, `components/`, `lib/`, `types/` direkt im Repo-Root.

## Entschieden

Kein `src/`. Top-Level-Ordner liegen im Repo-Root, Import-Alias `@/*` → `./*`.

## Verworfen

- **src/-Verzeichnis** — etwas aufgeräumterer Root, würde aber von der
  dokumentierten Struktur abweichen; alle Pfadangaben in der Doku müssten mental
  übersetzt werden.

## Konsequenzen

- Pfade in Doku/Anweisungen bleiben gültig; kein Übersetzungs-Layer.
- Der Import-Alias `@/...` macht die fehlende `src/`-Ebene im Code ohnehin unsichtbar.
