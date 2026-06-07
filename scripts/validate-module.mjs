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
import { wordCount } from '../lib/blocks/tokenize.ts';

const GRADED = new Set([
  'multiple_choice',
  'true_false',
  'fill_blank',
  'match',
  'categorize',
  'mark_words',
  'order',
  'hotspot',
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

  if (b.type === 'categorize') {
    const bucketIds = b.buckets.map((bk) => bk.id);
    if (new Set(bucketIds).size !== bucketIds.length) {
      errors.push(`${b.id} (categorize): doppelte bucket-id.`);
    }
    const itemIds = b.items.map((it) => it.id);
    if (new Set(itemIds).size !== itemIds.length) {
      errors.push(`${b.id} (categorize): doppelte item-id.`);
    }
    // Jedes Item muss auf einen existierenden Behälter zeigen.
    const bucketSet = new Set(bucketIds);
    for (const it of b.items) {
      if (!bucketSet.has(it.bucketId)) {
        errors.push(`${b.id} (categorize): item "${it.id}" zeigt auf unbekannten Behälter.`);
      }
    }
  }

  if (b.type === 'mark_words') {
    const total = wordCount(b.text);
    if (total === 0) {
      errors.push(`${b.id} (mark_words): text enthält kein markierbares Wort.`);
    }
    // Jeder correctIndex muss auf ein existierendes Wort zeigen.
    for (const idx of b.correctIndices) {
      if (idx >= total) {
        errors.push(
          `${b.id} (mark_words): correctIndex ${idx} liegt außerhalb (nur ${total} Wörter).`
        );
      }
    }
    if (new Set(b.correctIndices).size !== b.correctIndices.length) {
      errors.push(`${b.id} (mark_words): doppelter correctIndex.`);
    }
  }

  if (b.type === 'order') {
    const ids = b.items.map((it) => it.id);
    if (new Set(ids).size !== ids.length) {
      errors.push(`${b.id} (order): doppelte item-id.`);
    }
    if (b.items.some((it) => it.text.trim() === '')) {
      errors.push(`${b.id} (order): leerer item-text.`);
    }
  }

  if (b.type === 'hotspot') {
    const ids = b.areas.map((a) => a.id);
    if (new Set(ids).size !== ids.length) {
      errors.push(`${b.id} (hotspot): doppelte area-id.`);
    }
    if (!b.areas.some((a) => a.isCorrect)) {
      errors.push(`${b.id} (hotspot): mindestens eine Zone muss richtig (isCorrect) sein.`);
    }
    for (const a of b.areas) {
      if (a.x < 0 || a.x > 1 || a.y < 0 || a.y > 1) {
        errors.push(`${b.id} (hotspot): area "${a.id}" Koordinate außerhalb [0,1].`);
      }
      const shape = a.shape ?? 'circle';
      if (shape === 'rect') {
        if (typeof a.width !== 'number' || typeof a.height !== 'number') {
          errors.push(`${b.id} (hotspot): Rechteck-Zone "${a.id}" braucht width + height.`);
        } else if (a.width <= 0 || a.width > 1 || a.height <= 0 || a.height > 1) {
          errors.push(`${b.id} (hotspot): Rechteck-Zone "${a.id}" width/height außerhalb (0,1].`);
        }
      } else if (typeof a.r !== 'number') {
        errors.push(`${b.id} (hotspot): Kreis-Zone "${a.id}" braucht r.`);
      }
      if (a.rotation !== undefined && (a.rotation < 0 || a.rotation > 359)) {
        errors.push(`${b.id} (hotspot): area "${a.id}" rotation außerhalb [0,359].`);
      }
    }
  }
}

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
