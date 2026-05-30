// Validiert ein Modul-JSON gegen das ECHTE Schema (lib/schemas/blocks.ts),
// BEVOR es in den Admin-Editor oder ein Seed-SQL wandert. Schließt die
// Validierungs-Lücke des Seed-Pfads und gibt KI-Autor:innen schnelle,
// konkrete Rückmeldung.
//
// Nutzung:
//   pnpm validate:module pfad/zu/modul.json
//   pnpm validate:module               (liest dann von stdin)
//
// Akzeptiert entweder { "blocks": [...] } oder direkt [...] (Block-Array).
// Exit-Code 0 = gültig, 1 = ungültig/Fehler. Single Source of Truth ist
// moduleContentSchema — kein dupliziertes Schema hier.

import { readFileSync } from 'node:fs';
import { moduleContentSchema } from '../lib/schemas/blocks.ts';

const GRADED = new Set(['multiple_choice', 'true_false', 'fill_blank', 'match']);

function readInput() {
  const file = process.argv[2];
  if (file) {
    return readFileSync(file, 'utf8');
  }
  // Kein Pfad → von stdin lesen (z. B. via Pipe).
  return readFileSync(0, 'utf8');
}

function fail(msg) {
  console.error(`\n❌  ${msg}\n`);
  process.exit(1);
}

let raw;
try {
  raw = readInput();
} catch (e) {
  fail(`Konnte die Eingabe nicht lesen: ${e.message}`);
}

let json;
try {
  json = JSON.parse(raw);
} catch (e) {
  fail(`Ungültiges JSON: ${e.message}`);
}

// Beide Formen erlauben: { blocks: [...] } oder direkt [...]
const content = Array.isArray(json) ? { blocks: json } : json;

const result = moduleContentSchema.safeParse(content);

if (!result.success) {
  console.error('\n❌  Modul-JSON ist UNGÜLTIG. Probleme:\n');
  for (const issue of result.error.issues) {
    const path = issue.path.length ? issue.path.join('.') : '(Wurzel)';
    console.error(`  • ${path}: ${issue.message}`);
  }
  console.error('\nSiehe docs/MODUL-SPEZIFIKATION.md für die korrekte Struktur.\n');
  process.exit(1);
}

// Zusätzliche fachliche Checks, die das Zod-Schema NICHT abdeckt, aber die
// für korrekte Bewertung/Anzeige nötig sind (siehe MODUL-SPEZIFIKATION.md).
const blocks = result.data.blocks;
const warnings = [];
const errors = [];

const ids = blocks.map((b) => b.id);
const dupIds = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dupIds.length) {
  errors.push(
    `Doppelte Block-id(s): ${[...new Set(dupIds)].join(', ')} — ids müssen eindeutig sein.`
  );
}

let gradedCount = 0;
for (const b of blocks) {
  if (GRADED.has(b.type)) gradedCount++;

  if (b.type === 'multiple_choice') {
    const correct = b.options.filter((o) => o.correct).length;
    if (correct === 0) {
      errors.push(`${b.id} (multiple_choice): keine Option mit "correct": true — mind. 1 nötig.`);
    }
    const optIds = b.options.map((o) => o.id);
    if (new Set(optIds).size !== optIds.length) {
      errors.push(`${b.id} (multiple_choice): doppelte Options-id.`);
    }
  }

  if (b.type === 'fill_blank') {
    // Platzhalter {0},{1},… im Text müssen zur Anzahl der solutions passen.
    const placeholders = [...b.text.matchAll(/\{(\d+)\}/g)].map((m) => Number(m[1]));
    const maxIdx = placeholders.length ? Math.max(...placeholders) : -1;
    if (maxIdx + 1 !== b.solutions.length) {
      errors.push(
        `${b.id} (fill_blank): Text hat Platzhalter bis {${maxIdx}}, aber ${b.solutions.length} solutions — Anzahl muss exakt übereinstimmen.`
      );
    }
  }

  if (b.type === 'match') {
    const cats = new Set(b.pairs.map((p) => p.category));
    if (cats.size < 2) {
      errors.push(
        `${b.id} (match): nur ${cats.size} Kategorie(n) — mind. 2 unterschiedliche nötig.`
      );
    }
    const pairIds = b.pairs.map((p) => p.id);
    if (new Set(pairIds).size !== pairIds.length) {
      errors.push(`${b.id} (match): doppelte pair-id.`);
    }
  }
}

if (gradedCount === 0) {
  warnings.push(
    'Keine auto-bewertbaren Blöcke (multiple_choice/true_false/fill_blank/match) — das Modul kann nicht prozentual bewertet werden (max_score wäre 0).'
  );
}

if (errors.length) {
  console.error('\n❌  Modul-JSON verletzt fachliche Regeln:\n');
  for (const e of errors) console.error(`  • ${e}`);
  console.error('\nSiehe docs/MODUL-SPEZIFIKATION.md.\n');
  process.exit(1);
}

console.log(`\n✅  Modul-JSON ist gültig.`);
console.log(
  `   ${blocks.length} Block(s), davon ${gradedCount} auto-bewertbar (max_score = ${gradedCount}).`
);
for (const w of warnings) console.log(`\n⚠️   ${w}`);
console.log('');
process.exit(0);
