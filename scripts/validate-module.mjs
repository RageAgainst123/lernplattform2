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
// moduleContentStrictSchema (Struktur + fachliche IMMER-Regeln aus
// blocks-refine.ts) — kein dupliziertes Schema hier. Zusätzlich laufen die
// Publish-Gate-Checks als FEHLER: was dieses Script prüft, ist für den
// Import + die Veröffentlichung gedacht, nicht für halbe Editor-Entwürfe.

import { readFileSync } from 'node:fs';
import { moduleContentStrictSchema } from '../lib/schemas/blocks.ts';
import { publishGateIssues } from '../lib/schemas/blocks-refine.ts';

const GRADED = new Set([
  'multiple_choice',
  'true_false',
  'fill_blank',
  'match',
  'categorize',
  'mark_words',
  'order',
  'hotspot',
  'label_image',
  'memory',
  'crossword',
]);

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

const result = moduleContentStrictSchema.safeParse(content);

if (!result.success) {
  console.error('\n❌  Modul-JSON ist UNGÜLTIG. Probleme:\n');
  for (const issue of result.error.issues) {
    const path = issue.path.length ? issue.path.join('.') : '(Wurzel)';
    console.error(`  • ${path}: ${issue.message}`);
  }
  console.error('\nSiehe docs/MODUL-SPEZIFIKATION.md für die korrekte Struktur.\n');
  process.exit(1);
}

const blocks = result.data.blocks;

// Publish-Gate als Fehler: ein Modul-JSON, das durch dieses Script geht, soll
// ohne Nacharbeit veröffentlichbar sein (hotspot-Zonen, label_image-Begriffe).
const errors = publishGateIssues(blocks);
const warnings = [];

const gradedCount = blocks.filter((b) => GRADED.has(b.type)).length;

// Presentation-Heuristik: wenn ALLE Blöcke Live-/Folien-Typen sind, ist das
// vermutlich ein bewusstes Live-Modul (display_mode='presentation'). Dann ist
// „keine Bewertung" das gewollte Verhalten und keine Warnung nötig — stattdessen
// ein Hinweis dass dieses Modul mit display_mode='presentation' importiert werden
// soll. Wenn aber Theorie-Blöcke (text/infobox/reflection) ohne Aufgaben gemixt
// sind, bleibt es ein degeneriertes Worksheet → klassische Warnung.
const LIVE_TYPES = new Set([
  'slide',
  'live_poll',
  'quiz_poll',
  'word_cloud',
  'scale',
  'understanding',
]);
const allLive = blocks.length > 0 && blocks.every((b) => LIVE_TYPES.has(b.type));

if (gradedCount === 0) {
  if (allLive) {
    warnings.push(
      'Live-Modul erkannt (alle Blöcke sind slide/live_poll/quiz_poll/word_cloud/scale/understanding). Beim Import unbedingt display_mode auf „presentation" setzen — Worksheet-Modus rendert diese Block-Typen nicht.'
    );
  } else {
    warnings.push(
      'Keine auto-bewertbaren Blöcke (multiple_choice/true_false/fill_blank/match) — das Modul kann nicht prozentual bewertet werden (max_score wäre 0).'
    );
  }
}

// Mix-Warnung: Live-Blöcke + Worksheet-Aufgaben gemischt funktioniert weder im
// Worksheet- noch im Presentation-Modus sauber. Lieber in zwei Module trennen.
const hasLive = blocks.some((b) => LIVE_TYPES.has(b.type));
const hasWorksheetTask = blocks.some((b) => GRADED.has(b.type));
if (hasLive && hasWorksheetTask) {
  warnings.push(
    'Mix erkannt: das Modul enthält Live-Blöcke UND Worksheet-Aufgaben. Im Worksheet-Modus werden Live-Blöcke nicht angezeigt; im Presentation-Modus werden Worksheet-Aufgaben nicht angezeigt. Bitte in zwei Module trennen.'
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
