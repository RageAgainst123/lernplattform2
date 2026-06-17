// Fachliche Modul-Validierung (EDIT-CRIT-1). Lebte vorher NUR in
// scripts/validate-module.mjs — Editor-Save und Server-Actions ließen kaputte
// Module durch (z. B. multiple_choice ohne richtige Option). Jetzt:
//
//   1. refineModuleContent — IMMER-Regeln als superRefine auf
//      moduleContentStrictSchema (blocks.ts). Greift in Editor-Save,
//      JSON-Import, createModule/updateModule und validate-module.mjs.
//      NICHT auf dem lesenden moduleContentSchema: Bestands-Inhalte in der DB
//      dürfen durch neue Regeln nie unlesbar werden (Schüler:in bekäme 404).
//   2. publishGateIssues — Checks, die im ENTWURF legitim offen sind (hotspot
//      ohne Zonen: der/die Admin zeichnet sie erst im Editor), aber vor dem
//      Veröffentlichen erfüllt sein müssen. Geprüft in ModuleEditor.handleSave
//      und serverseitig in module-actions.ts (Defense in Depth).
//
// Typ-spezifische Regeln, die KEINE Modul-Sicht brauchen, leben in den
// Block-Schemas selbst (memory-Karten, crossword-Gitter, Zonen-Geometrie).
// Relative Imports mit .ts-Endung: validate-module.mjs lädt via
// node --experimental-strip-types, ohne @/-Alias.

import { wordCount } from '../blocks/tokenize.ts';
import type {
  Block,
  CategorizeBlock,
  FillBlankBlock,
  HotspotBlock,
  LabelImageBlock,
  MarkWordsBlock,
  MatchBlock,
  MultipleChoiceBlock,
  OrderBlock,
} from './blocks.ts';

// Strukturell statt z.core.$RefinementCtx (Methoden-Syntax → bivariant
// zuweisbar an zods superRefine-Signatur, ohne zod-Import hier).
type RefineCtx = {
  addIssue(issue: { code: 'custom'; path: (string | number)[]; message: string }): void;
};

type Push = (message: string) => void;

function dupes(values: string[]): string[] {
  return [...new Set(values.filter((v, i) => values.indexOf(v) !== i))];
}

function pushDupes(values: string[], what: string, push: Push): void {
  for (const d of dupes(values)) push(`doppelte ${what} "${d}".`);
}

function checkMultipleChoice(b: MultipleChoiceBlock, push: Push): void {
  if (!b.options.some((o) => o.correct)) {
    push('keine Option mit "correct": true — mind. 1 nötig.');
  }
  pushDupes(
    b.options.map((o) => o.id),
    'Options-id',
    push
  );
}

// Platzhalter {0},{1},… im Text müssen zur Anzahl der solutions passen.
function checkFillBlank(b: FillBlankBlock, push: Push): void {
  const placeholders = [...b.text.matchAll(/\{(\d+)\}/g)].map((m) => Number(m[1]));
  const maxIdx = placeholders.length ? Math.max(...placeholders) : -1;
  if (maxIdx + 1 !== b.solutions.length) {
    push(
      `Text hat Platzhalter bis {${maxIdx}}, aber ${b.solutions.length} solutions — Anzahl muss exakt übereinstimmen.`
    );
  }
}

function checkMatch(b: MatchBlock, push: Push): void {
  const cats = new Set(b.pairs.map((p) => p.category));
  if (cats.size < 2) {
    push(`nur ${cats.size} Kategorie(n) — mind. 2 unterschiedliche nötig.`);
  }
  pushDupes(
    b.pairs.map((p) => p.id),
    'pair-id',
    push
  );
}

function checkCategorize(b: CategorizeBlock, push: Push): void {
  pushDupes(
    b.buckets.map((bk) => bk.id),
    'bucket-id',
    push
  );
  pushDupes(
    b.items.map((it) => it.id),
    'item-id',
    push
  );
  const bucketSet = new Set(b.buckets.map((bk) => bk.id));
  for (const it of b.items) {
    if (!bucketSet.has(it.bucketId)) push(`item "${it.id}" zeigt auf unbekannten Behälter.`);
  }
}

function checkMarkWords(b: MarkWordsBlock, push: Push): void {
  const total = wordCount(b.text);
  if (total === 0) push('text enthält kein markierbares Wort.');
  for (const idx of b.correctIndices) {
    if (idx >= total) push(`correctIndex ${idx} liegt außerhalb (nur ${total} Wörter).`);
  }
  if (new Set(b.correctIndices).size !== b.correctIndices.length) {
    push('doppelter correctIndex.');
  }
}

function checkOrder(b: OrderBlock, push: Push): void {
  pushDupes(
    b.items.map((it) => it.id),
    'item-id',
    push
  );
  if (b.items.some((it) => it.text.trim() === '')) push('leerer item-text.');
}

// Nur Gruppen-Referenzen — ob Zonen existieren/richtig sind, ist Entwurf-
// legitim offen und gehört ins Publish-Gate (gateHotspot).
function checkHotspot(b: HotspotBlock, push: Push): void {
  pushDupes(
    b.areas.map((a) => a.id),
    'area-id',
    push
  );
  if (!b.groups?.length) return;
  const groupIds = new Set(b.groups.map((g) => g.id));
  for (const a of b.areas) {
    if (a.groupId !== undefined && !groupIds.has(a.groupId)) {
      push(`area "${a.id}" verweist auf unbekannte Gruppe.`);
    }
  }
}

function checkBlock(b: Block, push: Push): void {
  switch (b.type) {
    case 'multiple_choice':
      return checkMultipleChoice(b, push);
    case 'fill_blank':
      return checkFillBlank(b, push);
    case 'match':
      return checkMatch(b, push);
    case 'categorize':
      return checkCategorize(b, push);
    case 'mark_words':
      return checkMarkWords(b, push);
    case 'order':
      return checkOrder(b, push);
    case 'hotspot':
      return checkHotspot(b, push);
    case 'label_image':
      return pushDupes(
        b.zones.map((zo) => zo.id),
        'zone-id',
        push
      );
    default:
      return;
  }
}

// IMMER-Regeln: gelten für Entwurf wie für veröffentlichte Module.
export function refineModuleContent(content: { blocks: Block[] }, ctx: RefineCtx): void {
  for (const d of dupes(content.blocks.map((b) => b.id))) {
    ctx.addIssue({
      code: 'custom',
      path: ['blocks'],
      message: `Doppelte Block-id "${d}" — ids müssen eindeutig sein.`,
    });
  }
  content.blocks.forEach((b, i) => {
    checkBlock(b, (message) =>
      ctx.addIssue({
        code: 'custom',
        path: ['blocks', i],
        message: `${b.id} (${b.type}): ${message}`,
      })
    );
  });
}

function gateHotspot(b: HotspotBlock, issues: string[]): void {
  if (b.areas.length === 0) {
    issues.push(
      `${b.id} (hotspot): keine Zonen gezeichnet — vor dem Veröffentlichen mind. eine richtige Zone anlegen.`
    );
    return;
  }
  if (!b.areas.some((a) => a.isCorrect)) {
    issues.push(`${b.id} (hotspot): mindestens eine Zone muss richtig (isCorrect) sein.`);
  }
  for (const g of b.groups ?? []) {
    if (!b.areas.some((a) => a.groupId === g.id && a.isCorrect)) {
      issues.push(`${b.id} (hotspot): Gruppe "${g.label}" hat keine richtige Zone.`);
    }
  }
}

function gateLabelImage(b: LabelImageBlock, issues: string[]): void {
  const labels = b.zones.map((zo) => zo.label.trim());
  if (labels.some((l) => l === '')) {
    issues.push(`${b.id} (label_image): jede Zone braucht einen nicht-leeren Begriff (label).`);
  }
  for (const d of dupes(labels.filter((l) => l !== ''))) {
    issues.push(
      `${b.id} (label_image): Begriff "${d}" doppelt — Begriffe müssen eindeutig sein (sonst mehrdeutig).`
    );
  }
}

// Entwurf-legitime Lücken, die vor dem Veröffentlichen geschlossen sein müssen.
// Leeres Array = Veröffentlichen erlaubt.
export function publishGateIssues(blocks: Block[]): string[] {
  const issues: string[] = [];
  for (const b of blocks) {
    if (b.type === 'hotspot') gateHotspot(b, issues);
    if (b.type === 'label_image') gateLabelImage(b, issues);
  }
  return issues;
}
