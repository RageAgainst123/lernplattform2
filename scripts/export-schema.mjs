// Auto-Schema-Export (B1, docs/AI-AUTHORING-DX.md §1).
//
// Leitet aus den Zod-Schemas (Single Source: lib/schemas/blocks.ts) zwei
// maschinen-/KI-lesbare Artefakte ab, damit eine KI/IDE Module gegen eine
// IMMER aktuelle, code-treue Referenz bauen kann — kein manuelles
// Doku-Nachziehen, kein Drift:
//
//   docs/generated/module-schema.json  — JSON-Schema (Draft 2020-12) über
//     z.toJSONSchema(moduleContentSchema). Struktur-Vertrag; IDEs bieten
//     Autocomplete, eine KI kann direkt dagegen validieren.
//   docs/generated/block-fields.md      — Felder-Tabelle pro Block-Typ, aus
//     dem JSON-Schema gerendert. Ersetzt das manuelle Tabellen-Pflegen.
//
// WICHTIG: superRefine-Regeln (z. B. „MC braucht ≥1 richtige Option",
// Gitter-Konflikte) erscheinen NICHT im JSON-Schema (sie sind imperativ).
// Deshalb bleibt `pnpm validate:module` die zweite Stufe für die fachlichen
// Regeln. Das JSON-Schema deckt die STRUKTUR, validate die LOGIK.
//
// Nutzung:
//   pnpm export:schema          schreibt die Artefakte
//   pnpm export:schema --check  vergleicht nur (CI) — Diff = Exit 1
//
// Relative .ts-Imports (kein @/-Alias): wird via node --experimental-strip-types
// geladen, ohne Alias-Auflösung (wie validate-module.mjs).

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { blockSchema, moduleContentSchema } from '../lib/schemas/blocks.ts';
import { BLOCK_DOCS } from '../lib/blocks/block-docs.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'docs', 'generated');
const SCHEMA_PATH = join(OUT_DIR, 'module-schema.json');
const FIELDS_PATH = join(OUT_DIR, 'block-fields.md');

const checkOnly = process.argv.includes('--check');

// ─── 1) JSON-Schema ────────────────────────────────────────────────────────
// unrepresentable:'any' → Zod-Konstrukte ohne JSON-Schema-Äquivalent werden zu
// {} statt zu werfen. io:'input' = die Form, die eine KI SCHREIBT (vor
// Defaults/Transforms).
const jsonSchema = z.toJSONSchema(moduleContentSchema, {
  unrepresentable: 'any',
  io: 'input',
});
const schemaText = JSON.stringify(jsonSchema, null, 2) + '\n';

// ─── 2) Felder-Tabelle pro Block-Typ ───────────────────────────────────────
const blockJson = z.toJSONSchema(blockSchema, { unrepresentable: 'any', io: 'input' });
const variants = blockJson.oneOf ?? blockJson.anyOf ?? [];

// Eine knappe Constraint-Beschreibung aus einem JSON-Schema-Knoten.
function describeType(node) {
  if (!node || typeof node !== 'object') return '—';
  if (node.const !== undefined) return `\`"${node.const}"\``;
  if (node.enum) return node.enum.map((e) => `\`${e}\``).join(' \\| ');
  const t = Array.isArray(node.type) ? node.type.join('/') : node.type;
  if (t === 'array') {
    const inner = node.items ? describeType(node.items) : 'Element';
    const range =
      node.minItems != null || node.maxItems != null
        ? ` (${node.minItems ?? 0}–${node.maxItems ?? '∞'})`
        : '';
    return `Array${range} von ${inner}`;
  }
  if (t === 'object') return 'Objekt';
  const bits = [];
  if (node.minLength != null || node.maxLength != null) {
    bits.push(`Länge ${node.minLength ?? 0}–${node.maxLength ?? '∞'}`);
  }
  if (node.minimum != null || node.maximum != null) {
    // Den Number.MAX_SAFE_INTEGER-„Default" (für .min(0) ohne .max) nicht zeigen.
    const max = node.maximum === 9007199254740991 ? '∞' : node.maximum;
    bits.push(`${node.minimum ?? '−∞'}–${max ?? '∞'}`);
  }
  if (node.pattern) bits.push(`Muster \`${node.pattern}\``);
  if (node.format) bits.push(node.format);
  return bits.length ? `${t} (${bits.join(', ')})` : (t ?? '—');
}

// Doku-Layer pro Typ aus der B2-Registry (lib/blocks/block-docs.ts): KI-Hinweise,
// Antwort-Format und ein vollständiges, schema-geprüftes Beispiel. So bekommt die
// KI nicht nur die Struktur, sondern die typischen Fallen + eine Vorlage.
function renderDoc(type) {
  const doc = BLOCK_DOCS[type];
  if (!doc) return [];
  const out = [''];
  out.push(`**Gruppe:** ${doc.group} · **Bewertung:** ${doc.graded}`);
  if (doc.editorOnly) out.push('> ⚠️ Nur im Editor mit Bild bauen — NICHT per KI-JSON.');
  out.push('', '**🤖 KI-Hinweise:**', ...doc.aiHints.map((h) => `- ${h}`));
  out.push('', `**Antwort-Format:** ${doc.answerFormat}`);
  out.push('', '**Beispiel:**', '', '```json', JSON.stringify(doc.example, null, 2), '```');
  return out;
}

function renderVariant(variant) {
  const props = variant.properties ?? {};
  const type = props.type?.const ?? '?';
  const required = new Set(variant.required ?? []);
  const rows = Object.entries(props)
    // id/type stehen im Tabellenkopf, nicht in jeder Zeile.
    .filter(([name]) => name !== 'type')
    .map(([name, node]) => {
      const pflicht = required.has(name) ? '✅' : '–';
      return `| \`${name}\` | ${describeType(node)} | ${pflicht} |`;
    });
  return [
    `### \`${type}\``,
    '',
    '| Feld | Typ / Regeln | Pflicht |',
    '| --- | --- | --- |',
    ...rows,
    ...renderDoc(type),
    '',
  ].join('\n');
}

const typesSorted = variants
  .map((v) => ({ v, type: v.properties?.type?.const ?? 'zzz' }))
  .sort((a, b) => a.type.localeCompare(b.type));

const fieldsText =
  [
    '<!-- AUTO-GENERIERT von scripts/export-schema.mjs — NICHT von Hand editieren.',
    '     Regenerieren mit: pnpm export:schema -->',
    '',
    '# Block-Felder (auto-generiert aus den Zod-Schemas)',
    '',
    `Diese Tabelle wird aus \`lib/schemas/blocks.ts\` abgeleitet und ist daher`,
    'immer code-treu. Sie deckt die **Struktur** ab (welche Felder, welche Typen,',
    'was Pflicht ist). **Fachliche Regeln** (z. B. „MC braucht ≥1 richtige',
    'Option", Kreuzungs-Konflikte im Gitter) leben in `superRefine` und erscheinen',
    'hier NICHT — die prüft `pnpm validate:module`. Pro Typ stehen unten zusätzlich',
    '**KI-Hinweise + ein geprüftes Beispiel** (aus der Registry `lib/blocks/block-docs.ts`).',
    'Ausführliche Prosa-Erklärungen: [`MODUL-SPEZIFIKATION.md`](../MODUL-SPEZIFIKATION.md) §3.',
    '',
    `**Gemeinsam:** jeder Block hat \`id\` (string, eindeutig) + \`type\`.`,
    `${typesSorted.length} Block-Typen total.`,
    '',
    ...typesSorted.map(({ v }) => renderVariant(v)),
  ].join('\n') + '\n';

// ─── 3) Schreiben oder Prüfen ──────────────────────────────────────────────
function readOrEmpty(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

if (checkOnly) {
  const stale = [];
  if (readOrEmpty(SCHEMA_PATH) !== schemaText) stale.push('docs/generated/module-schema.json');
  if (readOrEmpty(FIELDS_PATH) !== fieldsText) stale.push('docs/generated/block-fields.md');
  if (stale.length) {
    console.error(
      `\n❌  Generierte Schema-Artefakte sind veraltet:\n${stale
        .map((s) => `  • ${s}`)
        .join('\n')}\n\nLauf \`pnpm export:schema\` und committe die Änderungen.\n`
    );
    process.exit(1);
  }
  console.log('✅  Schema-Artefakte sind aktuell.');
  process.exit(0);
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(SCHEMA_PATH, schemaText);
writeFileSync(FIELDS_PATH, fieldsText);
console.log(
  `✅  Geschrieben:\n  • docs/generated/module-schema.json (${typesSorted.length} Block-Typen)\n  • docs/generated/block-fields.md`
);
